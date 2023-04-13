import ZweihanderBaseActor from './base-actor';
import * as ZweihanderUtils from '../../utils';
import ZweihanderActorConfig from '../../apps/actor-config';
import {ZWEI} from "../../config";

export default class ZweihanderPC extends ZweihanderBaseActor {
  // changed by re4xn from 'prepareDerivedData' on 19-05-2022
  prepareBaseData(actor) {
    const configOptions = ZweihanderActorConfig.getConfig(actor);
    // set up utility variables
    const systemData = actor.system;
    systemData.tier = CONFIG.ZWEI.tiers[actor.items.filter((i) => i.type === 'profession').length];
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
            game.i18n.format("ZWEI.othermessages.novalidprimary", { primary: a.trim(), source: source })
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
    // assign inital peril & damage
    const sa = systemData.stats.secondaryAttributes;
    sa.perilThreshold = {};
    sa.damageThreshold = {};
    sa.perilThreshold.value = systemData.stats.primaryAttributes[configOptions.pthAttribute].bonus + 3;
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
    sa.damageThreshold.base = systemData.stats.primaryAttributes[configOptions.dthAttribute].bonus;
    sa.damageThreshold.mods = [];
    if (maxEquippedArmor && damageModifier > 0) {
      sa.damageThreshold.mods.push({
        source: `${maxEquippedArmor.name} DTM`,
        type: 'add',
        argument: damageModifier,
      });
    }

    const enc = (systemData.stats.secondaryAttributes.encumbrance = this._calculateEnumberance(actor, configOptions));

    systemData.stats.secondaryAttributes.initiative = this._calculateInitiative(actor, enc, configOptions);

    systemData.stats.secondaryAttributes.movement = this._calculateMovement(actor, enc, configOptions);
  }

  _calculateEnumberance(actor, configOptions) {
    // assign encumbrance from equipped trappings
    const systemData = actor.system;
    const carriedTrappings = actor.items.filter(
      (i) => ['trapping', 'armor', 'weapon'].includes(i.type) && i.system.carried
    );
    const nine4one = game.settings.get('zweihander', 'encumbranceNineForOne');

    const smallTrappings = carriedTrappings.filter((t) => t.system.encumbrance === 0);

    // bonus to encumbrance limit as described in "Carrying equipment", ZH p.216
    const containerBonus = smallTrappings
      .map((t) => ZWEI.containerEncumbranceBonus[t.name] ?? 0)
      .reduce((a,b) => Math.max(a,b), 0);

    const smallTrappingsCount = smallTrappings
      .map((t) => t.system.quantity || 0)
      .reduce((a, b) => a + b, 0);
    const smallTrappingsEnc = !nine4one ? 0 : Math.floor(smallTrappingsCount / 9);
    const normalTrappingsEnc = carriedTrappings
      .filter((t) => t.system.encumbrance !== 0)
      .map((t) => t.system.encumbrance * (t.system.quantity ?? 1))
      .reduce((a, b) => a + b, 0);

    // assign encumbrance from currency
    const currencyEnc = Math.floor(Object.values(systemData.currency).reduce((a, b) => a + b, 0) / 1000);

    const enc =  {};
    // assign initial encumbrance threshold
    enc.value = systemData.stats.primaryAttributes.brawn.bonus + 3 + configOptions.encumbranceModifier + containerBonus;
    // assign current encumbrance
    enc.current = smallTrappingsEnc + normalTrappingsEnc + currencyEnc;
    // assign overage
    enc.overage = Math.max(0, enc.current - enc.value);
    return enc;
  }

  _calculateInitiative(actor, enc, configOptions) {
    const systemData = actor.system;
    const ini = {};
    ini.value =
      systemData.stats.primaryAttributes[configOptions.intAttribute].bonus + 3 + configOptions.initiativeModifier;
    ini.overage = enc.overage;
    ini.current = Math.max(0, ini.value - ini.overage);
    return ini;
  }

  _calculateMovement(actor, enc, configOptions) {
    const systemData = actor.system;
    const mov = {};
    mov.value =
      systemData.stats.primaryAttributes[configOptions.movAttribute].bonus + 3 + configOptions.movementModifier;
    mov.overage = enc.overage;
    mov.current = Math.max(0, mov.value - mov.overage);
    return mov;
  }

  // parry, dodge & magick depend on Item preparation being finished
  prepareEmbeddedDocuments(actor) {
    const noWarn = CONFIG.ZWEI.NO_WARN || actor._id === null;
    const configOptions = ZweihanderActorConfig.getConfig(actor);
    const systemData = actor.system;

    // get peril malus
    const basePerilCurrent = systemData.stats.secondaryAttributes.perilCurrent.value;
    const effectivePerilCurrent = this.getEffectivePerilLadderValue(
      basePerilCurrent,
      configOptions.isIgnoredPerilLadderValue
    );
    systemData.stats.secondaryAttributes.perilCurrent.effectiveValue = effectivePerilCurrent;
    const perilMalus = this.getPerilMalus(effectivePerilCurrent);
    // calculate special actions underlying values
    const calcSecondayAttributeSpecialActionValue = (secAttr, name) => {
      const skill = actor.items.find((item) => item.type === 'skill' && item.name === secAttr.associatedSkill);
      if (skill) {
        const primAttr = skill.system.associatedPrimaryAttribute.toLowerCase();
        secAttr.value =
          systemData.stats.primaryAttributes[primAttr].value + Math.max(0, skill.system.bonus - perilMalus);
      } else {
        noWarn ||
          ui?.notifications?.warn(
            game.i18n.format("ZWEI.othermessages.noassociated", { associated: secAttr.associatedSkill, secondary: name })
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

    if (!update.token) update.token = {};

    update.token.actorLink = true;

    await that.updateSource(update);
  }

  async _preUpdate(changed, options, user, actor) {
    const oldDamage = actor.system.stats.secondaryAttributes.damageCurrent.value;
    const newDamage = changed.system?.stats?.secondaryAttributes?.damageCurrent?.value;

    const injurySettingEnabled = game.settings.get('zweihander', 'injuryPrompt');

    if (injurySettingEnabled && newDamage !== undefined && newDamage < oldDamage && newDamage > 0 && newDamage <= 3) {
      let injuryToRoll = newDamage == 3 ? 'moderate' : newDamage == 2 ? 'serious' : 'grievous';

      await Dialog.confirm({
        title: `${actor.name}: ` + game.i18n.localize("ZWEI.othermessages.injuryconfig"),
        content: game.i18n.format("ZWEI.othermessages.rollinjury", { 
          injury: game.i18n.localize("ZWEI.actor.conditions." + injuryToRoll.toLowerCase() + "ly")
        }),
        yes: () => this._rollInjury(injuryToRoll, actor),
        defaultYes: false,
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
      flavor: game.i18n.localize("ZWEI.chatskill.avoidinjury"),
    });

    const injurySustained = rollResult.terms[0].results.some((die) => die.result === 6);

    if (!injurySustained) return;

    const tablesPack = game.packs.get('zweihander.zh-gm-tables');
    const tablesIndex = await tablesPack.getIndex();

    const injuryTableEntry = tablesIndex.find((table) => ZweihanderUtils.normalizedIncludes(table.name, injuryToRoll));

    const injuryTable = await tablesPack.getDocument(injuryTableEntry._id);

    const diceRoll = await injuryTable.roll();
    const finalResult = await injuryTable.draw({ roll: diceRoll });
  }

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
            ui.notifications.error(
              game.i18n.localize("ZWEI.othermessages.errorprofessions")
              );
          } else if (!previousTiersCompleted && !dragDroppedOwnProfession) {
            ui.notifications.error(
              game.i18n.localize("ZWEI.othermessages.errortier")
              );
          }
          if (!allTiersAssigned && previousTiersCompleted) {
            filteredData.push(item);
            numberOfProfessionsAttached++;
          }
        } else if (item.type === 'ancestry') {
          if (ancestryAttached) {
            ui.notifications.error(
              game.i18n.localize("ZWEI.othermessages.errorancestry")
              );
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
