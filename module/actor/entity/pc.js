import ZweihanderBaseActor from "./base-actor";
import * as ZweihanderUtils from "../../utils";
import ZweihanderActorConfig from "../../apps/actor-config";

export default class ZweihanderPC extends ZweihanderBaseActor {

  prepareDerivedData(actorData) {
    const noWarn = CONFIG.ZWEI.NO_WARN || actorData._id === null;
    const configOptions = ZweihanderActorConfig.getConfig(actorData);
    // set up utility variables
    const data = actorData.data;
    data.tier = CONFIG.ZWEI.tiers[actorData.items.filter(i => i.type === 'profession').length];
    // calculate primary attribute bonuses (first digit)
    Object.values(data.stats.primaryAttributes).forEach(a => a.bonus = Math.floor(a.value / 10));
    // add ancestral modifiers to the primary attribute bonuses
    const ancestry = actorData.items.find(i => i.type === 'ancestry');
    const applyBonusModifiers = (list, mod, source) => list?.forEach?.(a => {
      const attr = ZweihanderUtils.primaryAttributeMapping[a.slice(1,2)];
      //TODO should be safe to remove this after migration of existing data
      if (!attr) {
        ui?.notifications?.warn(`"${a.trim()}" is not a valid primary attribute bonus abbreviation in ${source}!`);
        return;
      }
      data.stats.primaryAttributes[attr].bonus += mod;
    })
    // ancestral bonus advances
    if (ancestry) {
      applyBonusModifiers(ancestry.data.data.ancestralModifiers.positive, +1, `ancestry ${ancestry.name} of actor ${actorData.name}`);
      applyBonusModifiers(ancestry.data.data.ancestralModifiers.negative, -1, `ancestry ${ancestry.name} of actor ${actorData.name}`);
    }
    // professional bonus advances
    actorData.items.filter(i => i.type === 'profession').forEach(p => {
      const advancesList = p.data.data.bonusAdvances?.filter?.(a => a.purchased)?.map?.(a => a.name) ?? [];
      applyBonusModifiers(advancesList, +1, `profession ${p.name} of actor ${actorData.name}`);
    })
    // assign inital peril & damage
    const sa = data.stats.secondaryAttributes;
    sa.perilThreshold = {};
    sa.damageThreshold = {};
    sa.perilThreshold.value = data.stats.primaryAttributes[configOptions.pthAttribute].bonus + 3;
    // get equipped armor
    const equippedArmor = actorData.items
      .filter(a => a.type === 'armor' && a.data.data.equipped);
    // calculate total damage threshold modifier from armor
    // according to the rule book, this doesn't stack, so we choose the maximium!
    // to account for shields with "maker's mark" quality, we need to implement active effects
    const maxEquippedArmor = equippedArmor?.[
      ZweihanderUtils.argMax(equippedArmor.map(a => a.data.data.damageThresholdModifier))
    ];
    const damageModifier = maxEquippedArmor?.data?.data?.damageThresholdModifier ?? 0;
    sa.damageThreshold.value = data.stats.primaryAttributes[configOptions.dthAttribute].bonus + damageModifier;;
    // active effects tracking Proof of Concept 
    sa.damageThreshold.base = data.stats.primaryAttributes[configOptions.dthAttribute].bonus;
    sa.damageThreshold.mods = [];
    if (maxEquippedArmor && damageModifier > 0) {
      sa.damageThreshold.mods.push(
        { source: `${maxEquippedArmor.name} DTM`, type: 'add', argument: damageModifier }
      );
    }
    // get peril malus
    const basePerilCurrent = data.stats.secondaryAttributes.perilCurrent.value
    const effectivePerilCurrent = this.getEffectivePerilLadderValue(basePerilCurrent, configOptions.isIgnoredPerilLadderValue);
    data.stats.secondaryAttributes.perilCurrent.effectiveValue = effectivePerilCurrent;
    const perilMalus = this.getPerilMalus(effectivePerilCurrent);
    // calculate special actions underlying values
    const calcSecondayAttributeSpecialActionValue = (secAttr, name) => {
      const skill = actorData.items.find(item => 
        item.type === 'skill' && item.name === secAttr.associatedSkill
      );
      if (skill) {
        const primAttr = skill.data.data.associatedPrimaryAttribute.toLowerCase();
        secAttr.value = data.stats.primaryAttributes[primAttr].value + Math.max(0, skill.data.data.bonus - perilMalus);
      } else {
        noWarn || ui?.notifications?.warn(`Can't find associated skill ${secAttr.associatedSkill} for secondary attribute ${name}!`);
      }
    }
    //calculate parry
    calcSecondayAttributeSpecialActionValue(data.stats.secondaryAttributes.parry, "Parry");
    //calculate parry
    calcSecondayAttributeSpecialActionValue(data.stats.secondaryAttributes.dodge, "Dodge");
    //calculate parry
    calcSecondayAttributeSpecialActionValue(data.stats.secondaryAttributes.magick, "Magick");
    // encumbrance calculations...
    // assign encumbrance from equipped trappings
    const carriedTrappings = actorData.items
      .filter(i => ['trapping', 'armor', 'weapon'].includes(i.type) && i.data.data.carried);
    const nine4one = game.settings.get("zweihander", "encumbranceNineForOne");
    const smallTrappingsEnc = !nine4one ? 0 : Math.floor(
      carriedTrappings
        .filter(t => t.data.data.encumbrance === 0)
        .map(t => t.data.data.quantity || 0)
        .reduce((a, b) => a + b, 0) / 9
    );
    const normalTrappingsEnc = carriedTrappings
      .filter(t => t.data.data.encumbrance !== 0)
      .map(t => t.data.data.encumbrance * (t.data.data.quantity ?? 1))
      .reduce((a, b) => a + b, 0);
    // assign encumbrance from currency
    const currencyEnc = Math.floor(
      Object.values(data.currency).reduce((a, b) => a + b, 0) / 1000
    );
    const enc = data.stats.secondaryAttributes.encumbrance = {};
    // assign initial encumbrance threshold
    enc.value = data.stats.primaryAttributes.brawn.bonus + 3 + configOptions.encumbranceModifier;
    // assign current encumbrance
    enc.current = smallTrappingsEnc + normalTrappingsEnc + currencyEnc;
    // assign overage
    enc.overage = Math.max(0, enc.current - enc.value)
    // calculate initiative
    const ini = data.stats.secondaryAttributes.initiative = {};
    ini.value = data.stats.primaryAttributes[configOptions.intAttribute].bonus + 3 + configOptions.initiativeModifier;
    ini.overage = enc.overage;
    ini.current = Math.max(0, ini.value - ini.overage);
    // calculate movement
    const mov = data.stats.secondaryAttributes.movement = {};
    mov.value = data.stats.primaryAttributes[configOptions.movAttribute].bonus + 3 + configOptions.movementModifier;
    mov.overage = enc.overage;
    mov.current = Math.max(0, mov.value - mov.overage);
  }

  async _preCreate(actorData, options, user, that) {
    // roll primary attributes for new pc
    await super._preCreate(actorData, options, user, that);
    const pas = actorData.data.stats.primaryAttributes;
    if (CONFIG.ZWEI.primaryAttributes.every(pa => pas[pa].value === 0)) {
      const update = {};
      for (let pa of CONFIG.ZWEI.primaryAttributes) {
        const roll = await (new Roll('2d10+35')).evaluate();
        update[`data.stats.primaryAttributes.${pa}.value`] = roll.total;
      }
      await actorData.update(update);
    }
  }

  async _preUpdate(changed, options, user, actor) {
    const actorData = actor.data;
    const oldDamage = actorData.data.stats.secondaryAttributes.damageCurrent.value;
    const newDamage = changed.data?.stats?.secondaryAttributes?.damageCurrent?.value;

    const injurySettingEnabled = game.settings.get("zweihander", "injuryPrompt");

    if (injurySettingEnabled && (newDamage !== undefined) && (newDamage < oldDamage) && ((newDamage > 0) && (newDamage <=3))) {
      let injuryToRoll = newDamage == 3 ? "Moderate" : newDamage == 2 ? "Serious" : "Grievous";

      await Dialog.confirm({
        title: `${actor.name}: Injury Configuration`,
        content: `<p>You are ${injuryToRoll}ly Wounded. Roll for Injury?</p>`,
        yes: () => this._rollInjury(injuryToRoll, actor),
        defaultYes: false
      });
    }
  }

  //@todo: refactor into another class, possibly dice.js
  async _rollInjury(injuryToRoll, actor) {
    const injuryChaosRoll = new Roll(`${injuryToRoll === 'Moderate' ? 1 : injuryToRoll === 'Serious' ? 2 : 3}d6`, actor.data.data);
    const rollResult = await injuryChaosRoll.evaluate();

    await rollResult.toMessage({ speaker: ChatMessage.getSpeaker({ actor: actor }), content: injuryChaosRoll.total, flavor: `Attempts to avoid Injury...` });

    const injurySustained = rollResult.terms[0].results.some(die => die.result === 6);

    if (!injurySustained) return;

    const tablesPack = game.packs.get("zweihander.zh-gm-tables");
    const tablesIndex = await tablesPack.getIndex();

    const injuryTableEntry = tablesIndex.find(table => ZweihanderUtils.normalizedIncludes(table.name, injuryToRoll));

    const injuryTable = await tablesPack.getDocument(injuryTableEntry._id);

    const diceRoll = await injuryTable.roll();
    const finalResult = await injuryTable.draw({ "roll": diceRoll })
  }

  async createEmbeddedDocuments(embeddedName, data, context, actor) {
    if (embeddedName === "Item") {
      const filteredData = [];
      let ancestryAttached = actor.data.items.some(i => i.type === 'ancestry');
      const actorProfessions = actor.data.items.filter(i => i.type === 'profession');
      let numberOfProfessionsAttached = actorProfessions.length;
      for (let item of data) {
        if (item.type === "profession") {
          const previousTiersCompleted = actorProfessions
            .map(profession => profession.data.data.completed)
            .every(value => value === true);
          const allTiersAssigned = numberOfProfessionsAttached == 3;
          const dragDroppedOwnProfession = actorProfessions.some(p => p._id === item._id);
          if (allTiersAssigned && !dragDroppedOwnProfession) {
            ui.notifications.error("A character may not enter more than 3 Professions.");
          } else if (!previousTiersCompleted && !dragDroppedOwnProfession) {
            ui.notifications.error("A character must complete the previous Tier before entering a new Profession.");
          }
          if (!allTiersAssigned && previousTiersCompleted) {
            filteredData.push(item);
            numberOfProfessionsAttached++;
          }
        } else if (item.type === "ancestry") {
          if (ancestryAttached) {
            ui.notifications.error("A character may not possess more than 1 Ancestry.");
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