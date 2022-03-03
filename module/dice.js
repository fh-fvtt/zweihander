import FortuneTracker from "./apps/fortune-tracker";
import ZweihanderQuality from "./item/entity/quality";
import * as ZweihanderUtils from "./utils";
import { getTestConfiguration } from "./apps/test-config";

export const PERIL_ROLL_TYPES = {
  STRESS: { x: 1, title: 'Stress', difficultyRating: 20 },
  FEAR: { x: 2, title: 'Fear', difficultyRating: 0 },
  TERROR: { x: 3, title: 'Terror', difficultyRating: -20 }
}

export const OUTCOME_TYPES = {
  CRITICAL_SUCCESS: 3,
  SUCCESS: 2,
  FAILURE: 1,
  CRITICAL_FAILURE: 0
}

export async function reRollTest(actorId, skillItemId, testType, testConfiguration = {}, { showDialog = false } = {}) {
  const actor = game.actors.get(actorId);
  const skillItem = actor.items.get(skillItemId);
  return rollTest(skillItem, testType, testConfiguration, { isReroll: true, showDialog });
}

export async function rollPeril(perilType, actor) {
  const resolveSkill = actor.items.find(i => i.type === 'skill' && i.name === 'Resolve');
  const { outcome } = await rollTest(
    resolveSkill, 'skill', {
      difficultyRating: perilType.difficultyRating,
      flavor: `Is trying to surpress their ${perilType.title}`,
      perilType
    },
    { showDialog: true }
  );
  if (!isSuccess(outcome)) {
    const roll = new Roll(`${perilType.x}d10+${perilType.x}`);
    const speaker = ChatMessage.getSpeaker({actor: actor});
    roll.toMessage({ flavor: `Is rolling for peril due to ${perilType.title}`, speaker });
  }
}

export async function rollCombatReaction(type, enemyActorId, enemyTestConfiguration) {
  const actor = game.actors.get(ZweihanderUtils.determineCurrentActorId(true));
  if (!actor) return;
  const associatedSkill = actor.data.data.stats.secondaryAttributes[type].associatedSkill;
  const skillItem = actor.items.find(i => ZweihanderUtils.normalizedEquals(i.name, associatedSkill) && i.type === 'skill');
  const originalActorName = game.actors.get(enemyActorId).name;
  const updatedTestConfiguration = {
    difficultyRating: -enemyTestConfiguration.difficultyRating,
    flavor: `Trying to ${type} ${originalActorName}'s Attack`
  };
  return rollTest(skillItem, type, updatedTestConfiguration, { showDialog: true });
}

export async function rollTest(skillItem, testType = 'skill', testConfiguration = {}, { showDialog = false, isReroll = false, create = true } = {}) {
  const actor = skillItem.actor;
  const weapon = testType === 'weapon' ? actor.items.get(testConfiguration.weaponId) : undefined;
  const spell = testType === 'spell' ? actor.items.get(testConfiguration.spellId) : undefined;
  if (isReroll && actor.type === 'character') {
    testConfiguration.useFortune = 'fortune';
  } else if (isReroll && actor.type !== 'character') {
    testConfiguration.useFortune = 'misfortune';
  }
  const principle = spell?.data?.data?.principle?.value?.trim?.()?.toLowerCase?.();
  const defaultSpellDifficulty = {
    'petty': 10,
    'generalist': 10,
    'lesser': 0,
    'greater': -10
  }[principle];
  if (showDialog) {
    testConfiguration.difficultyRating = (testConfiguration.difficultyRating ?? (defaultSpellDifficulty ?? 0));
    testConfiguration = await getTestConfiguration(skillItem, testType, testConfiguration);
  }
  try {
    if (testConfiguration.useFortune === 'fortune') {
      await FortuneTracker.INSTANCE.useFortune();
    } else if (testConfiguration.useFortune === 'misfortune') {
      await FortuneTracker.INSTANCE.useMisfortune();
    }
  } catch (e) {
    ui.notifications.warn(`Couldn't reroll skill test: There are no ${testConfiguration.useFortune} points left.`);
    return;
  }
  const primaryAttribute = skillItem.data.data.associatedPrimaryAttribute.value;
  const primaryAttributeValue = actor.data.data.stats.primaryAttributes[primaryAttribute.toLowerCase()].value;
  const rank = skillItem.data.data.rank;
  const bonusPerRank = skillItem.data.data.bonusPerRank;
  const rankBonus = skillItem.data.data.bonus;
  const currentPeril = Number(actor.data.data.stats.secondaryAttributes.perilCurrent.effectiveValue);
  const ranksPurchasedAfterPeril = Math.max(0, rank - Math.max(0, 4 - currentPeril));
  const ranksIgnoredByPeril = rank - ranksPurchasedAfterPeril;
  const rankBonusAfterPeril = ranksPurchasedAfterPeril * bonusPerRank;
  const specialBaseChanceModifier = Number(testConfiguration.baseChanceModifier);
  const baseChance = primaryAttributeValue + Math.max(-30, Math.min(30, rankBonusAfterPeril + specialBaseChanceModifier));
  const rawDifficultyRating = Number(testConfiguration.difficultyRating);
  const channelPowerBonus = testConfiguration.channelPowerBonus;
  const difficultyRating = Math.min(30, rawDifficultyRating + (testConfiguration.channelPowerBonus || 0));
  const difficultyRatingLabel = ZweihanderUtils.getDifficultyRatingLabel(difficultyRating);
  let totalChance = baseChance + difficultyRating;
  totalChance = (totalChance >= 100 ? 99 : (totalChance < 1 ? 1 : totalChance))
    .toLocaleString(undefined, { "minimumIntegerDigits": 2 });
  const flip = testConfiguration.flip;
  const skillTestFn = testConfiguration.zweihanderRollMode === 'assisted' ? simulateAssistedTest : simulateStandardTest;
  const { effectiveResult, effectiveOutcome, effectivelyFlipped, roll } = await skillTestFn.bind(this)(totalChance, flip);
  const zweihanderRollModeLabel = testConfiguration.zweihanderRollMode.capitalize() + ' Test';
  let tensDie = Math.floor(effectiveResult / 10);
  tensDie = tensDie === 0 ? 10 : tensDie;
  const primaryAttributeBonus = actor.data.data.stats.primaryAttributes[primaryAttribute.toLowerCase()].bonus;
  const crbDegreesOfSuccess = effectiveOutcome < 2 ? 0 : `${tensDie} + ${primaryAttributeBonus} [${primaryAttribute[0]}B] = ${tensDie+primaryAttributeBonus}`;
  // const starterKitDegreesOfSuccess = effectiveOutcome < 2 ? 0 : 100 - (totalChance - effectiveResult);
  const templateData = {
    itemId: skillItem.id,
    zweihanderRollModeLabel,
    degreesOfSuccess: testConfiguration.zweihanderRollMode === 'opposed' ? crbDegreesOfSuccess : false,
    skill: skillItem.name,
    primaryAttribute,
    primaryAttributeValue,
    rankBonus,
    specialBaseChanceModifier,
    baseChance,
    difficultyRating: {
      raw: rawDifficultyRating,
      channelPowerBonus,
      total: difficultyRating,
      label: difficultyRatingLabel
    },
    totalChance,
    perilPenalty: -ranksIgnoredByPeril * bonusPerRank,
    roll: (effectiveResult).toLocaleString(undefined, { "minimumIntegerDigits": 2 }),
    diceFormula: roll.formula,
    effectivelyFlipped,
    flipToFail: flip === 'fail',
    flipToSucceed: flip === 'succeed',
    isReroll,
    usedFortune: testConfiguration.useFortune === 'fortune',
    usedMisfortune: testConfiguration.useFortune === 'misfortune',
    effectiveOutcome,
    outcomeLabel: outcomeLabel(effectiveOutcome),
    weaponTest: testType === 'weapon',
    spellTest: testType === 'spell',
    tooltip: await roll.getTooltip()
  };
  if (spell) {
    templateData.itemId = spell.id;
    templateData.spell = spell.toObject(false);
    templateData.spell.data.distance.value = await ZweihanderUtils.parseDataPaths(templateData.spell.data.distance.value, actor);
    templateData.spell.data.duration.value = await ZweihanderUtils.parseDataPaths(templateData.spell.data.duration.value, actor);
    const totalChaosDie = testConfiguration.additionalChaosDice + (testConfiguration.channelPowerBonus / 10);
    if (totalChaosDie > 0) {
      const formula = `${totalChaosDie}d6`;
      const chaosRoll = await (new Roll(formula)).evaluate();
      setTimeout(() => game?.dice3d?.showForRoll?.(chaosRoll, game.user, true), 1500);
      const chaosManifestation = chaosRoll.terms[0].results.some(r => r.result === 6);
      templateData.chaosManifestation = chaosManifestation;
    }
  }
  const content = await renderTemplate(CONFIG.ZWEI.templates.skill, templateData);
  const flavor = testConfiguration.flavor ?? { //@todo: this could be a funny feature to expand
    skill: "Is rolling a skill test",
    dodge: "Is trying to dodge",
    parry: "Is trying to parry",
    weapon: `Attacks with ${weapon?.name}`,
    spell: `Casts ${spell?.name}`
  }[testType] ?? "";
  const speaker = ChatMessage.getSpeaker({ actor });
  const rollMode = zweihanderRollModeToFoundryRollMode(testConfiguration.zweihanderRollMode);
  const flags = {
    zweihander: {
      skillTestData: {
        actorId: actor.id,
        skillItemId: skillItem.id,
        testType,
        testConfiguration,
        outcome: effectiveOutcome
      }
    }
  };
  let messageData = await roll.toMessage({ content, flavor, speaker, flags }, { rollMode, create });
  // magick content
  if (create) {
    messageData = messageData.toObject();
  }
  return {
    outcome: effectiveOutcome,
    messageData
  };
}

export async function rollWeaponDamage(actorId, testConfiguration) {
  const { weaponId, additionalFuryDice } = testConfiguration;
  const actor = game.actors.get(actorId);
  const weapon = actor.items.get(weaponId).toObject(false);
  const formula = ZweihanderUtils.abbreviations2DataPath(
    weapon.data.damage.formula.replace("[#]", additionalFuryDice || 0)
  );
  const damageRoll = await (new Roll(formula, actor.data.data)).evaluate();
  const speaker = ChatMessage.getSpeaker({ actor });
  const flavor = `Determines ${weapon.name}'s Damage`;
  const content = await getWeaponDamageContent(weapon, damageRoll);
  const flags = {
    zweihander: {
      weaponTestData: {
        actorId,
        weaponId,
        exploded: false
      }
    }
  };
  return damageRoll.toMessage({ speaker, flavor, content, flags }, { rollMode: CONST.DICE_ROLL_MODES.PUBLIC });
}

async function getWeaponDamageContent(weapon, roll, exploded = false) {
  weapon.data.qualities = await ZweihanderQuality.getQualities(weapon.data.qualities.value);
  const rollContent = await roll.render({flavor: 'Fury Die'});
  const cardContent = await renderTemplate('systems/zweihander/templates/item-card/item-card-weapon.hbs', weapon);
  return await renderTemplate(CONFIG.ZWEI.templates.weapon,  { cardContent, rollContent, exploded });
}

export async function explodeWeaponDamage(message, useFortune) {
  try {
    if (useFortune === 'fortune') {
      await FortuneTracker.INSTANCE.useFortune();
    } else if (useFortune === 'misfortune') {
      await FortuneTracker.INSTANCE.useMisfortune();
    }
  } catch (e) {
    ui.notifications.warn(`Couldn't reroll skill test: There are no ${testConfiguration.useFortune} points left.`);
    return;
  }
  const { actorId, weaponId } = message.data.flags.zweihander.weaponTestData;
  const actor = game.actors.get(actorId);
  const weapon = actor.items.get(weaponId).toObject(false);
  const roll = Roll.fromJSON(message.data.roll);
  const dice = roll.dice.find(d => d.faces === 6);
  if (dice) {
    const explodeModifiers = dice.modifiers.filter(m => m.startsWith('x')).join('');
    const formula = `1d6${explodeModifiers}`;
    const explodingRoll = await (new Roll(formula)).evaluate();
    setTimeout(() => game?.dice3d?.showForRoll?.(explodingRoll, game.user, true), 1500);
    const results = dice.results;
    const minimumResult = Math.min(...results.map(r => r.result));
    const minimumResultIndex = results.findIndex(r => r.result === minimumResult);
    const updatedTotal = roll._total - minimumResult + 6 + explodingRoll.total;
    results.splice(minimumResultIndex, 1, {result: 6, active: true, exploded: true}, ...explodingRoll.terms[0].results);
    roll._total = updatedTotal;
  }
  const content = await getWeaponDamageContent(weapon, roll, useFortune);
  const diffData = {
    'flags.zweihander.weaponTestData.exploded': true,
    'content': content,
    'roll': roll.toJSON()
  };
  await game.zweihander.socket.executeAsGM("updateChatMessage", message.id, diffData);
}

export function isSuccess(outcome) {
  return outcome === OUTCOME_TYPES.CRITICAL_SUCCESS || outcome === OUTCOME_TYPES.SUCCESS;
}

async function simulateStandardTest(totalChance, flip) {
  const firstD10 = (await (new Roll("1d10")).evaluate()).total;
  const secondD10 = (await (new Roll("1d10")).evaluate()).total;
  const { score, flipped, outcome } = determineTestResult(firstD10, secondD10, flip, totalChance);
  const naturalRoll = getScore(firstD10, secondD10);
  const roll = Roll.fromTerms([new Die({ number: 1, faces: 100, results: [{ result: naturalRoll, active: true }] })]);
  roll.dice[0].options.sfx = { id: "zh-outcome", result: outcomeLabel(outcome) };
  return {
    effectiveResult: score,
    effectiveOutcome: outcome,
    effectivelyFlipped: flipped,
    roll
  }
}

async function simulateAssistedTest(totalChance, flip) {
  const firstD10 = (await (new Roll("1d10")).evaluate()).total % 10;
  const secondD10 = (await (new Roll("1d10")).evaluate()).total % 10;
  const thirdD10 = (await (new Roll("1d10")).evaluate()).total % 10;
  const tens = Math.min(firstD10, secondD10);
  const units1 = Math.max(firstD10, secondD10);
  const units2 = thirdD10;
  const score1 = getScore(tens, units1);
  const score2 = getScore(tens, units2);
  const outcome1 = getResultOutcome(score1, totalChance, tens === units1);
  const outcome2 = getResultOutcome(score2, totalChance, tens === units2);
  let units;
  if (outcome1 === outcome2) {
    // no difference, keep minimum for the possibility of switch to fail
    units = Math.min(units1, units2);
  } else if (outcome1 < 2 && outcome2 >= 2) {
    // keep success
    units = units2
  } else if (outcome1 >= 2 && outcome2 < 2) {
    // keep success
    units = units1;
  } else if (outcome1 === 1) {
    // avoid critical failures
    units = units1;
  } else if (outcome2 === 1) {
    // avoid critical failures
    units = units2;
  } else if (outcome1 === 3) {
    // prefer critical success
    units = units1;
  } else { // in this case (outcome2 === 3)
    // prefer critical success
    units = units2;
  }
  const { score, flipped, outcome } = determineTestResult(tens, units, flip, totalChance);
  const starterKitTerms = [new Die({ number: 3, faces: 10, results: [{ result: firstD10, active: true }, { result: secondD10, active: true }, { result: thirdD10, active: true }] })];
  // const crbTerms = [new Die({number: 1, faces: 100, results: [{result: getScore(tens, units1), active: true}]}), await (new OperatorTerm({operator: "+"})).evaluate(), new Die({number: 1, faces: 10, results: [{result: thirdD10 === 0 ? 10 : thirdD10, active: true}]})];
  const roll = Roll.fromTerms(starterKitTerms);
  roll.dice.forEach(d => d.options.sfx = { id: "zh-outcome", result: outcomeLabel(outcome) });
  return {
    effectiveResult: score,
    effectiveOutcome: outcome,
    effectivelyFlipped: flipped,
    roll
  }
}


function determineTestResult(firstD10, secondD10, flip, totalChance) {
  const normalScore = getScore(firstD10, secondD10);
  const flippedScore = getScore(secondD10, firstD10);
  const match = firstD10 === secondD10;
  const normalOutcome = getResultOutcome(normalScore, totalChance, match);
  const flippedOutcome = getResultOutcome(flippedScore, totalChance, match);
  if (normalScore === 0 || normalScore === 1) {
    // cannot flip to fail the results of 01% or 100%.
    return { score: normalScore, flipped: false, outcome: normalOutcome };
  } else if (match) {
    // die match, don't flip
    return { score: normalScore, flipped: false, outcome: normalOutcome };
  } else if (flip === 'succeed') {
    if (normalOutcome >= 2 && flippedOutcome >= 2) {
      // if both scores are successes, keep the maximum (better for opposed rolls)
      const max = Math.max(normalScore, flippedScore);
      return { score: max, flipped: max === flippedScore, outcome: normalOutcome };
    } else if (normalOutcome < 2 && flippedOutcome >= 2) {
      return { score: flippedScore, flipped: true, outcome: flippedOutcome };
    } else {
      return { score: normalScore, flipped: false, outcome: normalOutcome }
    }
  } else if (flip === 'fail') {
    if (normalOutcome >= 2 && flippedOutcome >= 2) {
      // if both scores are successes, keep the minimum (worse for opposed rolls)
      const min = Math.min(normalScore, flippedScore);
      return { score: min, flipped: min === flippedScore, outcome: normalOutcome };
    } else if (normalOutcome >= 2 && flippedOutcome < 2) {
      return { score: flippedScore, flipped: true, outcome: flippedOutcome };
    } else {
      return { score: normalScore, flipped: false, outcome: normalOutcome };
    }
  } else {
    return { score: normalScore, flipped: false, outcome: normalOutcome };
  }
}

function getScore(tens, units) {
  tens %= 10;
  units %= 10;
  return tens === 0 && units === 0 ? 100 : tens * 10 + units;
}

function getResultOutcome(score, totalChance, match) {
  if (score === 100 || (score > totalChance && match))
    return 0; // critical failure
  else if (score === 1 || (score <= totalChance && match))
    return 3; // critical success
  else if (score > totalChance && !match)
    return 1; // failure
  else if (score <= totalChance && !match)
    return 2; // success
}

function outcomeLabel(outcome) {
  return ["Critical Failure", "Failure", "Success", "Critical Success"][outcome];
}

function zweihanderRollModeToFoundryRollMode(mode) {
  switch (mode) {
    case 'private':
      return CONST.DICE_ROLL_MODES.PRIVATE;
    case 'secret':
      return CONST.DICE_ROLL_MODES.BLIND;
    case 'self':
      return CONST.DICE_ROLL_MODES.SELF;
    default:
      return CONST.DICE_ROLL_MODES.PUBLIC;
  }
}