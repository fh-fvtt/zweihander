import ZweihanderBaseActor from './base-actor';
import * as ZweihanderUtils from '../../utils';
import ZweihanderActorConfig from '../../apps/actor-config';

const { DialogV2 } = foundry.applications.api;

export default class ZweihanderPC extends ZweihanderBaseActor {
  // parry, dodge & magick depend on Item preparation being finished
  prepareEmbeddedDocuments(actor) {
    const noWarn = CONFIG.ZWEI.NO_WARN || actor._id === null;
    const configOptions = ZweihanderActorConfig.getConfig(actor);
    const systemData = actor.system;

    const alternativePerilSystem = game.settings.get('zweihander', 'alternativePerilSystem');

    // get peril malus
    const basePerilCurrent = systemData.stats.secondaryAttributes.perilCurrent.value;
    const effectivePerilCurrent = this.getEffectivePerilLadderValue(
      basePerilCurrent,
      configOptions.isIgnoredPerilLadderValue
    );
    systemData.stats.secondaryAttributes.perilCurrent.effectiveValue = effectivePerilCurrent;
    const perilMalus = this.getPerilMalus(effectivePerilCurrent, alternativePerilSystem);

    // calculate special actions underlying values
    const calcSecondayAttributeSpecialActionValue = (secAttr, name) => {
      const skill = actor.items.find((item) => item.type === 'skill' && item.name === secAttr.associatedSkill);
      if (skill) {
        const primAttr = skill.system.associatedPrimaryAttribute.toLowerCase();
        const perilMalusFinal = alternativePerilSystem
          ? skill.system.bonus + perilMalus
          : Math.max(0, skill.system.bonus - perilMalus);
        secAttr.value = Math.max(0, systemData.stats.primaryAttributes[primAttr].value + perilMalusFinal);
      } else {
        noWarn ||
          ui?.notifications?.warn(
            game.i18n.format('ZWEI.othermessages.noassociated', {
              associated: secAttr.associatedSkill,
              secondary: name,
            })
          );
      }
    };
    //calculate parry
    calcSecondayAttributeSpecialActionValue(systemData.stats.secondaryAttributes.parry, 'Parry');
    //calculate dodge
    calcSecondayAttributeSpecialActionValue(systemData.stats.secondaryAttributes.dodge, 'Dodge');
    //calculate magick
    calcSecondayAttributeSpecialActionValue(systemData.stats.secondaryAttributes.magick, 'Magick');
  }

  applyActiveEffects(actor, preparationStage) {
    const overrides = {};
    actor.statuses.clear();

    const paKeys = CONFIG.ZWEI.primaryAttributeKeys;
    const pabKeys = CONFIG.ZWEI.primaryAttributeBonusKeys;
    const saKeys = CONFIG.ZWEI.secondaryAttributeKeys;

    // Organize non-disabled effects by their application priority
    const changes = [];
    for (const effect of actor.allApplicableEffects()) {
      if (!effect.active) continue;

      changes.push(
        ...effect.changes.flatMap((change) => {
          if (
            (preparationStage === 'initial' && (saKeys.includes(change.key) || pabKeys.includes(change.key))) ||
            (preparationStage === 'intermediate' && (saKeys.includes(change.key) || paKeys.includes(change.key))) ||
            (preparationStage === 'final' && (paKeys.includes(change.key) || pabKeys.includes(change.key)))
          )
            return [];

          const c = foundry.utils.deepClone(change);
          c.effect = effect;
          c.priority = c.priority ?? c.mode * 10;
          return [c];
        })
      );
      for (const statusId of effect.statuses) actor.statuses.add(statusId);
    }

    changes.sort((a, b) => a.priority - b.priority);

    // console.log(`CHANGES @ stage ${preparationStage}:`, changes);

    // Apply all changes
    for (let change of changes) {
      if (!change.key) continue;
      const changes = change.effect.apply(actor, change);
      Object.assign(overrides, changes);
    }

    // Expand the set of final overrides
    actor.overrides = foundry.utils.expandObject(overrides);
  }

  prepareDerivedData(actor) {
    const configOptions = ZweihanderActorConfig.getConfig(actor);

    // set up utility variables
    const systemData = actor.system;
    const tierKey = CONFIG.ZWEI.tiers[actor.items.filter((i) => i.type === 'profession').length];

    if (typeof tierKey === 'undefined') systemData.tier = '';
    else
      systemData.tier = game.i18n.localize(
        'ZWEI.actor.tiers.' + CONFIG.ZWEI.tiers[actor.items.filter((i) => i.type === 'profession').length]
      );

    // calculate primary attribute bonuses (first digit)
    Object.values(systemData.stats.primaryAttributes).forEach((a) => (a.bonus = Math.floor(a.value / 10)));

    // add ancestral modifiers to the primary attribute bonuses
    const ancestry = actor.items.find((i) => i.type === 'ancestry');
    const applyBonusModifiers = (list, mod, source) =>
      list?.forEach?.((a) => {
        const attr = ZweihanderUtils.primaryAttributeMapping[a.slice(1, 2)];
        //TODO should be safe to remove this after migration of existing data
        if (!attr) {
          ui?.notifications?.warn(
            game.i18n.format('ZWEI.othermessages.novalidprimary', { primary: a.trim(), source: source })
          );
          return;
        }
        systemData.stats.primaryAttributes[attr].bonus += mod;
      });

    // ancestral bonus advances
    if (ancestry) {
      applyBonusModifiers(
        ancestry.system.ancestralModifiers.positive,
        +1,
        `ancestry ${ancestry.name} of actor ${actor.name}`
      );
      applyBonusModifiers(
        ancestry.system.ancestralModifiers.negative,
        -1,
        `ancestry ${ancestry.name} of actor ${actor.name}`
      );
    }

    // professional bonus advances
    actor.items
      .filter((i) => i.type === 'profession')
      .forEach((p) => {
        const advancesList = p.system.bonusAdvances?.filter?.((a) => a.purchased)?.map?.((a) => a.name) ?? [];
        applyBonusModifiers(advancesList, +1, `profession ${p.name} of actor ${actor.name}`);
      });

    // calculate primary attribute base bonus values (prior to Active Effects being applied)
    Object.values(systemData.stats.primaryAttributes).forEach((a) => (a.baseBonus = a.bonus));

    this.applyActiveEffects(actor, 'intermediate');

    // assign inital peril & damage
    const sa = systemData.stats.secondaryAttributes;
    sa.perilThreshold = {};
    sa.damageThreshold = {};

    sa.perilThreshold.baseValue = systemData.stats.primaryAttributes[configOptions.pthAttribute].bonus + 3; // for Active Effect purposes
    sa.perilThreshold.value = sa.perilThreshold.baseValue;

    // get equipped armor
    const equippedArmor = actor.items.filter((a) => a.type === 'armor' && a.system.equipped);
    // calculate total damage threshold modifier from armor
    // according to the rule book, this doesn't stack, so we choose the maximium!
    // to account for shields with "maker's mark" quality, we need to implement active effects
    const maxEquippedArmor =
      equippedArmor?.[ZweihanderUtils.argMax(equippedArmor.map((a) => a.system.damageThresholdModifier))];
    const damageModifier = maxEquippedArmor?.system?.damageThresholdModifier ?? 0;
    sa.damageThreshold.value = systemData.stats.primaryAttributes[configOptions.dthAttribute].bonus + damageModifier;
    // active effects tracking Proof of Concept
    sa.damageThreshold.baseValue = systemData.stats.primaryAttributes[configOptions.dthAttribute].bonus;
    sa.damageThreshold.dtm = damageModifier;

    // encumbrance calculations...
    // assign encumbrance from equipped trappings
    const carriedTrappings = actor.items.filter(
      (i) => ['trapping', 'armor', 'weapon'].includes(i.type) && i.system.carried
    );
    const nine4one = game.settings.get('zweihander', 'encumbranceNineForOne');
    const smallTrappingsEnc = !nine4one
      ? 0
      : Math.floor(
          carriedTrappings
            .filter((t) => t.system.encumbrance === 0)
            .map((t) => t.system.quantity || 0)
            .reduce((a, b) => a + b, 0) / 9
        );
    const normalTrappingsEnc = carriedTrappings
      .filter((t) => t.system.encumbrance !== 0)
      .map((t) => t.system.encumbrance * (t.system.quantity ?? 1))
      .reduce((a, b) => a + b, 0);
    // assign encumbrance from currency
    const currencyEnc = Math.floor(Object.values(systemData.currency).reduce((a, b) => a + b, 0) / 1000);
    const enc = (systemData.stats.secondaryAttributes.encumbrance = {});
    // assign initial encumbrance threshold
    enc.baseValue = systemData.stats.primaryAttributes.brawn.bonus + 3 + configOptions.encumbranceModifier;
    enc.value = enc.baseValue;
    // assign current encumbrance
    enc.current = smallTrappingsEnc + normalTrappingsEnc + currencyEnc;

    // calculate initiative
    const ini = (systemData.stats.secondaryAttributes.initiative = {});
    ini.baseValue =
      systemData.stats.primaryAttributes[configOptions.intAttribute].bonus + 3 + configOptions.initiativeModifier;
    ini.value = ini.baseValue;

    // calculate movement
    const mov = (systemData.stats.secondaryAttributes.movement = {});
    mov.baseValue =
      systemData.stats.primaryAttributes[configOptions.movAttribute].bonus + 3 + configOptions.movementModifier;
    mov.value = mov.baseValue;

    // apply Active Effects to derived values here
    this.applyActiveEffects(actor, 'final');

    // these have to come after Active Effects, since they depend on derived values that can be affected by Active Effects
    enc.overage = Math.max(0, enc.current - enc.value);

    ini.overage = enc.overage;
    ini.current = Math.max(0, ini.value - ini.overage);

    mov.overage = enc.overage;
    mov.current = Math.max(0, mov.value - mov.overage);
  }

  async _preCreate(actor, options, user, that) {
    // roll primary attributes for new pc
    await super._preCreate(actor, options, user, that);
    const pas = actor.system.stats.primaryAttributes;

    const update = {};

    if (CONFIG.ZWEI.primaryAttributes.every((pa) => pas[pa].value === 0)) {
      for (let pa of CONFIG.ZWEI.primaryAttributes) {
        const roll = await new Roll('2d10+35').evaluate();
        update[`system.stats.primaryAttributes.${pa}.value`] = roll.total;
      }
    }

    if (!update.token) update.prototypeToken = {};

    update.prototypeToken.actorLink = true;

    await that.updateSource(update);
  }

  async _preUpdate(changed, options, user, actor) {
    const oldDamage = actor.system.stats.secondaryAttributes.damageCurrent.value;
    const newDamage = changed.system?.stats?.secondaryAttributes?.damageCurrent?.value;

    const injurySettingEnabled = game.settings.get('zweihander', 'injuryPrompt');

    if (injurySettingEnabled && newDamage !== undefined && newDamage < oldDamage && newDamage > 0 && newDamage <= 3) {
      let injuryToRoll = newDamage == 3 ? 'moderate' : newDamage == 2 ? 'serious' : 'grievous';

      await DialogV2.confirm({
        window: { title: `${actor.name}: ` + game.i18n.localize('ZWEI.othermessages.injuryconfig') },
        content: game.i18n.format('ZWEI.othermessages.rollinjury', {
          injury: game.i18n.localize('ZWEI.actor.conditions.' + injuryToRoll.toLowerCase() + 'ly'),
        }),
        yes: { callback: () => this._rollInjury(injuryToRoll, actor) },
        defaultYes: false,
        rejectClose: true,
      });
    }
  }

  //@todo: refactor into another class, possibly dice.js
  async _rollInjury(injuryToRoll, actor) {
    const injuryChaosRoll = new Roll(
      `${injuryToRoll === 'moderate' ? 1 : injuryToRoll === 'serious' ? 2 : 3}d6`,
      actor.system
    );
    const rollResult = await injuryChaosRoll.evaluate();

    await rollResult.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: injuryChaosRoll.total,
      flavor: game.i18n.localize('ZWEI.chatskill.avoidinjury'),
    });

    const injurySustained = rollResult.terms[0].results.some((die) => die.result === 6);

    if (!injurySustained) return;

    const injuryTablesPackName = game.settings.get('zweihander', 'injuryList');

    const injuryToRollLoc = game.i18n.localize('ZWEI.actor.items.injuryseverity.' + injuryToRoll.toLowerCase());

    const tablesPack = game.packs.get(injuryTablesPackName);

    let tablesIndex;

    try {
      tablesIndex = await tablesPack.getIndex();
    } catch (err) {
      ui.notifications.error(game.i18n.format('ZWEI.othermessages.injurytableerror', { pack: injuryTablesPackName }));
      return;
    }

    const injuryTableEntry = tablesIndex.find((table) =>
      ZweihanderUtils.normalizedIncludes(table.name, injuryToRollLoc)
    );

    if (injuryTableEntry) {
      const injuryTable = await tablesPack.getDocument(injuryTableEntry._id);

      const diceRoll = await injuryTable.roll();
      const finalResult = await injuryTable.draw({ roll: diceRoll });
    } else {
      ui.notifications.error(
        game.i18n.format('ZWEI.othermessages.injurytablemismatch', { severity: injuryToRollLoc, pack: tablesPack })
      );
    }
  }

  // @todo: refactor this into _preCreate methods in their respective classes
  async createEmbeddedDocuments(embeddedName, data, context, actor) {
    if (embeddedName === 'Item') {
      const filteredData = [];
      let ancestryAttached = actor.items.some((i) => i.type === 'ancestry');
      const actorProfessions = actor.items.filter((i) => i.type === 'profession');
      let numberOfProfessionsAttached = actorProfessions.length;
      for (let item of data) {
        if (item.type === 'profession') {
          const previousTiersCompleted = actorProfessions
            .map((profession) => profession.system.completed)
            .every((value) => value === true);
          const allTiersAssigned = numberOfProfessionsAttached == 3;
          const dragDroppedOwnProfession = actorProfessions.some((p) => p._id === item._id);
          if (allTiersAssigned && !dragDroppedOwnProfession) {
            ui.notifications.error(game.i18n.localize('ZWEI.othermessages.errorprofessions'));
          } else if (!previousTiersCompleted && !dragDroppedOwnProfession) {
            ui.notifications.error(game.i18n.localize('ZWEI.othermessages.errortier'));
          }
          if (!allTiersAssigned && previousTiersCompleted) {
            filteredData.push(item);
            numberOfProfessionsAttached++;
          }
        } else if (item.type === 'ancestry') {
          if (ancestryAttached) {
            ui.notifications.error(game.i18n.localize('ZWEI.othermessages.errorancestry'));
          } else {
            filteredData.push(item);
            ancestryAttached = true;
          }
        } else {
          filteredData.push(item);
        }
      }
      return filteredData;
    }
    return data;
  }
}
