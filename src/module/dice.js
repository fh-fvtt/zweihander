import FortuneTracker from './apps/fortune-tracker';
import ZweihanderQuality from './item/entity/quality';
import * as ZweihanderUtils from './utils';
import { getTestConfiguration } from './apps/test-config';
import { ZWEI } from './config';
import ZweihanderActorConfig from './apps/actor-config';

export const PERIL_ROLL_TYPES = {
  STRESS: { x: 1, title: 'stress', difficultyRating: 20 },
  FEAR: { x: 2, title: 'fear', difficultyRating: 0 },
  TERROR: { x: 3, title: 'terror', difficultyRating: -20 },
};

export const OUTCOME_TYPES = {
  CRITICAL_SUCCESS: 3,
  SUCCESS: 2,
  FAILURE: 1,
  CRITICAL_FAILURE: 0,
};

export async function reRollTest(actorId, skillItemId, testType, testConfiguration = {}, { showDialog = false } = {}) {
  const actor = game.actors.get(actorId);
  const skillItem = actor.items.get(skillItemId);
  return rollTest(skillItem, testType, testConfiguration, {
    isReroll: true,
    showDialog,
  });
}

export async function rollPeril(perilType, actor) {
  const perilSkillName = game.settings.get('zweihander', 'defaultPerilSkill');
  const resolveSkill = actor.items.find((i) => i.type === 'skill' && i.name === perilSkillName);
  const { outcome } = await rollTest(
    resolveSkill,
    'skill',
    {
      difficultyRating: perilType.difficultyRating,
      flavor: game.i18n.format('ZWEI.rolls.suppressperil', {
        periltype: game.i18n.localize('ZWEI.actor.secondary.' + perilType.title),
      }),
      perilType,
    },
    { showDialog: true }
  );
  if (!isSuccess(outcome)) {
    const roll = new Roll(`${perilType.x}d10+${perilType.x}`);
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    await roll.toMessage({
      flavor: game.i18n.format('ZWEI.rolls.rollingperil', {
        peril: game.i18n.localize('ZWEI.actor.secondary.peril'),
        periltype: game.i18n.localize('ZWEI.actor.secondary.' + perilType.title),
      }),
      speaker,
    });
  }
}

export async function rollCombatReaction(type, enemyActorId, enemyTestConfiguration) {
  const actor = game.actors.get(ZweihanderUtils.determineCurrentActorId(true));
  if (!actor) return;
  const associatedSkill = actor.system.stats.secondaryAttributes[type].associatedSkill;
  const skillItem = actor.items.find(
    (i) => ZweihanderUtils.normalizedEquals(i.name, associatedSkill) && i.type === 'skill'
  );
  const originalActorName = game.actors.get(enemyActorId).name;
  const updatedTestConfiguration = {
    difficultyRating: -enemyTestConfiguration.difficultyRating,
    flavor: `Trying to ${type} ${originalActorName}'s Attack`,
  };
  return rollTest(skillItem, type, updatedTestConfiguration, {
    showDialog: true,
  });
}

export async function rollTest(
  skillItem,
  testType = 'skill',
  testConfiguration = {},
  { showDialog = false, isReroll = false, create = true } = {}
) {
  const actor = skillItem.actor;
  const weapon = testType === 'weapon' ? actor.items.get(testConfiguration.weaponId) : undefined;
  const spell = testType === 'spell' ? actor.items.get(testConfiguration.spellId) : undefined;
  const disease = testType === 'disease' ? actor.items.get(testConfiguration.diseaseId) : undefined;
  if (weapon && !isReroll && actor.type === 'creature') {
    testConfiguration.additionalFuryDice = actor.system.details.size - 1;
  }
  if (isReroll && actor.type === 'character') {
    testConfiguration.useFortune = 'fortune';
  } else if (isReroll && actor.type !== 'character') {
    testConfiguration.useFortune = 'misfortune';
  }
  const principle = spell?.system?.principle?.trim?.()?.toLowerCase?.();
  const toughnessDifficulty = disease?.system?.resist ? Number(disease.system.resist) : undefined;
  const defaultSpellDifficulty = {
    petty: 10,
    generalist: 10,
    lesser: 0,
    greater: -10,
  }[principle];
  if (showDialog) {
    testConfiguration.difficultyRating =
      testConfiguration.difficultyRating ?? toughnessDifficulty ?? defaultSpellDifficulty ?? 0;
    testConfiguration = await getTestConfiguration(skillItem, testType, testConfiguration);
  }
  try {
    if (testConfiguration.useFortune === 'fortune') {
      await FortuneTracker.INSTANCE.useFortune();
    } else if (testConfiguration.useFortune === 'misfortune') {
      await FortuneTracker.INSTANCE.useMisfortune();
    }
  } catch (e) {
    return;
  }

  const isManualDodgeParryTest = _isManualDodgeParryTest(actor, testType);

  const primaryAttribute = skillItem.system.associatedPrimaryAttribute;
  const basePercentage = _getBasePercentage(actor, primaryAttribute, testType, isManualDodgeParryTest);

  const rank = skillItem.system.rank;
  const bonusPerRank = skillItem.system.bonusPerRank;
  const rankBonus = skillItem.system.bonus;

  const currentPeril = Number(actor.system.stats.secondaryAttributes.perilCurrent.effectiveValue);

  const { alternativePerilSystem, alternativePerilPenalty, ranksIgnoredByPeril, finalRankBonus } = _getPerilData(
    currentPeril,
    rank,
    rankBonus,
    bonusPerRank,
    isManualDodgeParryTest
  );

  const specialBaseChanceModifier = Number(testConfiguration.baseChanceModifier);

  const baseChance = basePercentage + Math.max(-30, Math.min(30, finalRankBonus + specialBaseChanceModifier));

  const rawDifficultyRating = Number(testConfiguration.difficultyRating);

  const channelPowerBonus = testConfiguration.channelPowerBonus;
  const difficultyRating = Math.min(30, rawDifficultyRating + (testConfiguration.channelPowerBonus || 0));
  const difficultyRatingLabel = ZweihanderUtils.getDifficultyRatingLabel(difficultyRating);
  let totalChance = baseChance + difficultyRating;
  totalChance = (totalChance >= 100 ? 99 : totalChance < 1 ? 1 : totalChance).toLocaleString(undefined, {
    minimumIntegerDigits: 2,
  });
  const flip = testConfiguration.flip;
  const skillTestFn = testConfiguration.testMode === 'assisted' ? simulateAssistedTest : simulateStandardTest;
  const { effectiveResult, effectiveOutcome, effectivelyFlipped, roll } = await skillTestFn.bind(this)(
    totalChance,
    flip
  );
  //const testModeLabel = ZWEI.testModes[testConfiguration.testMode].label;
  const testModeLabel = testConfiguration.testMode;
  let tensDie = Math.floor(effectiveResult / 10);
  tensDie = tensDie === 0 ? 10 : tensDie;
  const primaryAttributeBonus = actor.system.stats.primaryAttributes[primaryAttribute.toLowerCase()].bonus;
  const crbDegreesOfSuccess =
    effectiveOutcome < 2
      ? 0
      : `${tensDie} + ${primaryAttributeBonus} [${primaryAttribute[0].toUpperCase()}B] = ${
          tensDie + primaryAttributeBonus
        }`;
  // const starterKitDegreesOfSuccess = effectiveOutcome < 2 ? 0 : 100 - (totalChance - effectiveResult);
  const templateData = {
    itemId: skillItem.id,
    testModeLabel,
    degreesOfSuccess: ['opposed', 'secretopposed'].includes(testConfiguration.testMode) ? crbDegreesOfSuccess : false,
    skill: skillItem.name,
    requiresTraining: skillItem.system.requiresTraining,
    primaryAttribute:
      isManualDodgeParryTest || testType === 'dodge' || testType === 'parry'
        ? game.i18n.localize('ZWEI.chatskill.go' + testType)
        : game.i18n.localize('ZWEI.actor.primary.' + primaryAttribute.toLowerCase()),
    basePercentage,
    rankBonus,
    specialBaseChanceModifier,
    baseChance,
    difficultyRating: {
      raw: rawDifficultyRating,
      channelPowerBonus,
      total: difficultyRating,
      label: difficultyRatingLabel,
    },
    totalChance,
    perilPenalty: alternativePerilSystem ? alternativePerilPenalty : -ranksIgnoredByPeril * bonusPerRank,
    roll: effectiveResult.toLocaleString(undefined, {
      minimumIntegerDigits: 2,
    }),
    diceFormula: roll.formula,
    effectivelyFlipped,
    flipToFail: flip === 'flipfail',
    flipToSucceed: flip === 'flipsucceed',
    isReroll,
    usedFortune: testConfiguration.useFortune === 'fortune',
    usedMisfortune: testConfiguration.useFortune === 'misfortune',
    effectiveOutcome,
    outcomeLabel: outcomeLabel(effectiveOutcome),
    weaponTest: testType === 'weapon',
    spellTest: testType === 'spell',
    dodgeOrParryTest: testType === 'dodge' || testType === 'parry',
    tooltip: await roll.getTooltip(),
  };
  if (weapon) {
    templateData.weapon = weapon.toObject(false);
    templateData.weapon.system.qualities = await ZweihanderQuality.getQualities(weapon.system.qualities);
  }
  if (spell) {
    templateData.itemId = spell.id;
    templateData.spell = spell.toObject(false);

    templateData.spell.system.distance = await ZweihanderUtils.parseDataPaths(
      templateData.spell.system.distance,
      actor
    );

    templateData.spell.system.duration.label = await ZweihanderUtils.parseDataPaths(
      templateData.spell.system.duration.label,
      actor
    );
    const totalChaosDie = testConfiguration.additionalChaosDice + testConfiguration.channelPowerBonus / 10;
    if (totalChaosDie > 0) {
      const formula = `${totalChaosDie}d6`;
      const chaosRoll = await new Roll(formula).evaluate();
      setTimeout(() => game?.dice3d?.showForRoll?.(chaosRoll, game.user, true), 1500);
      const chaosManifestation = chaosRoll.terms[0].results.some((r) => r.result === 6);
      templateData.chaosManifestation = chaosManifestation;
    }
  }
  const content = await renderTemplate(CONFIG.ZWEI.templates.skill, templateData);
  const flavor =
    testConfiguration.flavor ??
    {
      //@todo: this could be a funny feature to expand
      skill: game.i18n.localize('ZWEI.rolls.skillflavor'),
      dodge: game.i18n.localize('ZWEI.rolls.dodgeflavor'),
      parry: game.i18n.localize('ZWEI.rolls.parryflavor'),
      weapon: game.i18n.localize('ZWEI.rolls.weaponflavor') + ` ${weapon?.name}`,
      spell: game.i18n.localize('ZWEI.rolls.spellflavor') + ` ${spell?.name}`,
    }[testType] ??
    '';
  const speaker = ChatMessage.getSpeaker({ actor });
  const rollMode = ZWEI.testModes[testConfiguration.testMode].rollMode;
  const flags = {
    zweihander: {
      skillTestData: {
        actorId: actor.id,
        skillItemId: skillItem.id,
        testType,
        testConfiguration,
        outcome: effectiveOutcome,
      },
    },
  };
  let sound;
  if (['dodge', 'parry'].includes(testType)) {
    if (isSuccess(effectiveOutcome)) {
      sound = ZweihanderActorConfig.getValue(actor, `${testType}Sound`);
    } else if (ZweihanderActorConfig.getValue(actor, 'playGruntSound')) {
      sound = ZweihanderActorConfig.getValue(actor, `gruntSound`);
    }
  }
  let messageData = await roll.toMessage({ content, flavor, speaker, flags, sound }, { rollMode, create });
  // magick content
  if (create) {
    messageData = messageData.toObject();
  }
  return {
    outcome: effectiveOutcome,
    messageData,
  };
}

export async function rollWeaponDamage(actorId, testConfiguration) {
  const { weaponId, additionalFuryDice } = testConfiguration;
  const actor = game.actors.get(actorId);
  const weapon = actor.items.get(weaponId).toObject(false);

  const damageData = weapon.system.damage;
  const furyData = damageData.fury;

  let rawFormula = '';

  const isFormulaManual = damageData.formula.override;

  if (isFormulaManual) {
    // e.g. [CB] + (1 + [#])d6x6 + 1
    rawFormula = damageData.formula.value.replace('[#]', additionalFuryDice || 0);
  } else {
    const attributeBonus = `${damageData.attributeBonus}`;
    const dice = `${1 + (additionalFuryDice || 0)}${damageData.die}`;
    const explodes = furyData.value;
    const explodesOn = `${explodes ? 'x' + furyData.explodesOn.join('&') : ''}`;
    const hasBonus = weapon.system.damage.bonus != 0;
    const bonus = `${hasBonus ? ' + ' + weapon.system.damage.bonus : ''}`;

    rawFormula = `${attributeBonus} + ${dice}${explodesOn}${bonus}`;
  }

  const parsedFormula = ZweihanderUtils.abbreviations2DataPath(rawFormula);

  const damageRoll = await new Roll(parsedFormula, actor.system).evaluate();
  const speaker = ChatMessage.getSpeaker({ actor });
  //const flavor = `Determines ${weapon.name}'s Damage`;
  const flavor = game.i18n.format('ZWEI.rolls.weapondamage', {
    weapon: weapon.name,
  });
  const content = await getWeaponDamageContent(weapon, damageRoll);
  const flags = {
    zweihander: {
      weaponTestData: {
        actorId,
        weaponId,
        exploded: 0,
      },
    },
  };
  return damageRoll.toMessage({ speaker, flavor, content, flags }, { rollMode: CONST.DICE_ROLL_MODES.PUBLIC });
}

function _isManualDodgeParryTest(actor, testType) {
  const isActorCreatureOrNpc = actor.type === 'creature' || actor.type === 'npc';
  const isActorInManualMode = isActorCreatureOrNpc ? actor.system.stats.manualMode : false;
  const isDodgeOrParryTest = testType === 'dodge' || testType === 'parry';

  return isActorInManualMode && isDodgeOrParryTest;
}

function _getBasePercentage(actor, primaryAttribute, testType, isManualDodgeParryTest) {
  if (isManualDodgeParryTest) return actor.system.stats.secondaryAttributes[testType].value;
  return actor.system.stats.primaryAttributes[primaryAttribute.toLowerCase()].value;
}

function _getPerilData(currentPeril, rank, rankBonus, bonusPerRank, isManualDodgeParryTest) {
  const alternativePerilSystem = game.settings.get('zweihander', 'alternativePerilSystem');
  const alternativePerilPenalty = CONFIG.ZWEI.alternativePerilTable[currentPeril];

  const ranksPurchasedAfterPeril = Math.max(0, rank - Math.max(0, 4 - currentPeril));
  const ranksIgnoredByPeril = rank - ranksPurchasedAfterPeril;

  const getFinalRankBonus = () => {
    if (isManualDodgeParryTest)
      return alternativePerilSystem ? alternativePerilPenalty : -ranksIgnoredByPeril * bonusPerRank;

    return alternativePerilSystem ? rankBonus + alternativePerilPenalty : ranksPurchasedAfterPeril * bonusPerRank;
  };

  return {
    alternativePerilSystem,
    alternativePerilPenalty,
    ranksIgnoredByPeril,
    finalRankBonus: getFinalRankBonus(),
  };
}

async function getWeaponDamageContent(weapon, roll, exploded = false, explodedCount = 0) {
  weapon.system.qualities = await ZweihanderQuality.getQualities(weapon.system.qualities);
  const tooltip = await roll.getTooltip();
  const total = roll.total;
  const formula = roll.formula;
  // Not needed at the moment
  // const cardContent = await renderTemplate('systems/zweihander/src/templates/item-card/item-card-weapon.hbs', weapon);
  return await renderTemplate(CONFIG.ZWEI.templates.weapon, {
    // cardContent,
    tooltip,
    total,
    formula,
    exploded,
    explodedCount,
    weapon,
  });
}

export async function explodeWeaponDamage(message, useFortune) {
  try {
    if (useFortune === 'fortune') {
      await FortuneTracker.INSTANCE.useFortune();
    } else if (useFortune === 'misfortune') {
      await FortuneTracker.INSTANCE.useMisfortune();
    }
  } catch (e) {
    // @todo: I believe it is the responsibility of the Fortune Tracker to throw an error if there are no points left,
    // otherwise, 2 error messages will be shown, which is annoying
    /*
    ui.notifications.warn(game.i18n.format("ZWEI.othermessages.noreroll", {
      usefortune: useFortune
    }));
    */
    return;
  }
  const { actorId, weaponId, exploded } = message.flags.zweihander.weaponTestData;
  const actor = game.actors.get(actorId);
  const weapon = actor.items.get(weaponId).toObject(false);
  const roll = message.rolls[0];
  const dice = roll.dice.find((d) => d.faces === 6);
  if (dice) {
    const explodeModifiers = dice.modifiers.filter((m) => m.startsWith('x')).join('');
    const formula = `1d6${explodeModifiers}`;
    const explodingRoll = await new Roll(formula).evaluate();
    setTimeout(() => game?.dice3d?.showForRoll?.(explodingRoll, game.user, true), 1500);
    const results = dice.results;
    const minimumResult = Math.min(...results.filter((x) => !x.exploded).map((r) => r.result));
    const minimumResultIndex = results.findIndex((r) => r.result === minimumResult);
    const updatedTotal = roll._total - minimumResult + 6 + explodingRoll.total;
    results.splice(
      minimumResultIndex,
      1,
      { result: 6, active: true, exploded: true },
      ...explodingRoll.terms[0].results
    );
    roll._total = updatedTotal;
  }
  const content = await getWeaponDamageContent(weapon, roll, useFortune, exploded + 1);
  const diffData = {
    'flags.zweihander.weaponTestData.exploded': exploded + 1,
    content: content,
    rolls: [roll.toJSON()],
  };
  await game.zweihander.socket.executeAsGM('updateChatMessage', message.id, diffData);
}

export function isSuccess(outcome) {
  return outcome === OUTCOME_TYPES.CRITICAL_SUCCESS || outcome === OUTCOME_TYPES.SUCCESS;
}

async function simulateStandardTest(totalChance, flip) {
  const firstD10 = (await new Roll('1d10').evaluate()).total;
  const secondD10 = (await new Roll('1d10').evaluate()).total;
  const { score, flipped, outcome } = determineTestResult(firstD10, secondD10, flip, totalChance);
  const naturalRoll = getScore(firstD10, secondD10);
  const roll = Roll.fromTerms([
    new Die({
      number: 1,
      faces: 100,
      results: [{ result: naturalRoll, active: true }],
    }),
  ]);
  roll.dice[0].options.sfx = {
    id: 'zh-outcome',
    result: outcomeLabel(outcome),
  };
  return {
    effectiveResult: score,
    effectiveOutcome: outcome,
    effectivelyFlipped: flipped,
    roll,
  };
}

async function simulateAssistedTest(totalChance, flip) {
  const firstD10 = (await new Roll('1d10').evaluate()).total % 10;
  const secondD10 = (await new Roll('1d10').evaluate()).total % 10;
  const thirdD10 = (await new Roll('1d10').evaluate()).total % 10;
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
    units = units2;
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
  } else {
    // in this case (outcome2 === 3)
    // prefer critical success
    units = units2;
  }
  const { score, flipped, outcome } = determineTestResult(tens, units, flip, totalChance);
  const starterKitTerms = [
    new Die({
      number: 3,
      faces: 10,
      results: [
        { result: firstD10, active: true },
        { result: secondD10, active: true },
        { result: thirdD10, active: true },
      ],
    }),
  ];
  // const crbTerms = [new Die({number: 1, faces: 100, results: [{result: getScore(tens, units1), active: true}]}), await (new OperatorTerm({operator: "+"})).evaluate(), new Die({number: 1, faces: 10, results: [{result: thirdD10 === 0 ? 10 : thirdD10, active: true}]})];
  const roll = Roll.fromTerms(starterKitTerms);
  roll.dice.forEach((d) => (d.options.sfx = { id: 'zh-outcome', result: outcomeLabel(outcome) }));
  return {
    effectiveResult: score,
    effectiveOutcome: outcome,
    effectivelyFlipped: flipped,
    roll,
  };
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
  } else if (flip === 'flipsucceed') {
    if (normalOutcome >= 2 && flippedOutcome >= 2) {
      // if both scores are successes, keep the maximum (better for opposed rolls)
      const max = Math.max(normalScore, flippedScore);
      return {
        score: max,
        flipped: max === flippedScore,
        outcome: normalOutcome,
      };
    } else if (normalOutcome < 2 && flippedOutcome >= 2) {
      return { score: flippedScore, flipped: true, outcome: flippedOutcome };
    } else {
      return { score: normalScore, flipped: false, outcome: normalOutcome };
    }
  } else if (flip === 'flipfail') {
    if (normalOutcome >= 2 && flippedOutcome >= 2) {
      // if both scores are successes, keep the minimum (worse for opposed rolls)
      const min = Math.min(normalScore, flippedScore);
      return {
        score: min,
        flipped: min === flippedScore,
        outcome: normalOutcome,
      };
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
  if (score === 100 || (score > totalChance && match)) return 0; // critical failure
  else if (score === 1 || (score <= totalChance && match)) return 3; // critical success
  else if (score > totalChance && !match) return 1; // failure
  else if (score <= totalChance && !match) return 2; // success
}

function outcomeLabel(outcome) {
  return ['Critical Failure', 'Failure', 'Success', 'Critical Success'][outcome];
}

export const patchDie = () => {
  Die.prototype.explode = async function (modifier, { recursive = true } = {}) {
    // patched explode
    // Match the explode or "explode once" modifier
    const rgx = /xo?([0-9\&]+)?([<>=]+)?([0-9\&]+)?/i;
    const match = modifier.match(rgx);
    if (!match) return false;
    let [max, comparison, target] = match.slice(1);

    // If no comparison or target are provided, treat the max as the target value
    if (max && !(target || comparison)) {
      target = max;
      max = null;
    }

    const targets = target.split('&').map((target) => (Number.isNumeric(target) ? parseInt(target) : this.faces));

    // Determine target values
    comparison = comparison || '=';

    // Determine the number of allowed explosions
    max = Number.isNumeric(max) ? parseInt(max) : recursive ? null : 1;

    // Recursively explode until there are no remaining results to explode
    let checked = 0;
    let initial = this.results.length;
    while (checked < this.results.length) {
      let r = this.results[checked];

      checked++;
      if (!r.active) continue;

      // Maybe we have run out of explosions
      if (max !== null && max <= 0) break;

      // Determine whether to explode the result and roll again!
      if (targets.some((t) => DiceTerm.compareResult(r.result, comparison, t))) {
        r.exploded = true;
        await this.roll({ explode: true });
        if (max !== null) max -= 1;
      }

      // Limit recursion
      if (!recursive && checked >= initial) checked = this.results.length;
      if (checked > 1000) throw new Error(game.i18n.localize('ZWEI.othermessages.errorrecursion'));
    }
  };

  Die.prototype._evaluateModifiers = async function () {
    const getSignature = (modifier) => {
      const rgx = /xo?([0-9\&]+)?([<>=]+)?([0-9\&]+)?/i;
      const match = modifier.match(rgx);
      if (!match) return [null, null, null];
      let [max, comparison, target] = match.slice(1);

      // If no comparison or target are provided, treat the max as the target value
      if (max && !(target || comparison)) {
        target = max;
        max = null;
      }
      // Determine target values
      comparison = comparison || '=';

      // Determine the number of allowed explosions
      const recursive = !modifier.match(/xo/i);
      max = Number.isNumeric(max) ? parseInt(max) : recursive ? null : 1;
      return [max, comparison, target];
    };
    const consolidateExplodes = (a, b) => {
      const [aMax, aComparison, aTarget] = getSignature(a);
      const [bMax, bComparison, bTarget] = getSignature(b);
      if (aMax === bMax && aComparison === bComparison) {
        const mod = aMax === 1 ? 'xo' : 'x';
        const max = aMax !== null && aMax !== 1 ? aMax : '';
        const mergedModifier = `${mod}${max}${aComparison}${aTarget},${bTarget}`;
        return [mergedModifier];
      } else {
        return [a, b];
      }
    };
    const cls = this.constructor;
    const requested = foundry.utils.deepClone(this.modifiers).reduce((agg, mod) => {
      if (!agg.length) return [mod];
      const last = agg.pop();
      return agg.concat(consolidateExplodes(last, mod));
    }, []);
    this.modifiers = [];

    // Iterate over requested modifiers
    for (let m of requested) {
      let command = m.match(/[A-z]+/)[0].toLowerCase();

      // Matched command
      if (command in cls.MODIFIERS) {
        await this._evaluateModifier(command, m);
        continue;
      }

      // Unmatched compound command
      // Sort modifiers from longest to shortest to ensure that the matching algorithm greedily matches the longest
      // prefixes first.
      const modifiers = Object.keys(cls.MODIFIERS).sort((a, b) => b.length - a.length);
      while (!!command) {
        let matched = false;
        for (let cmd of modifiers) {
          if (command.startsWith(cmd)) {
            matched = true;
            await this._evaluateModifier(cmd, cmd);
            command = command.replace(cmd, '');
            break;
          }
        }
        if (!matched) command = '';
      }
    }
  };
};
