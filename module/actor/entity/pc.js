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
      const advancesList = p.data.data.bonusAdvances?.filter?.(a => a.purchased)?.map?.(a => a.value) ?? [];
      applyBonusModifiers(advancesList, +1, `profession ${p.name} of actor ${actorData.name}`);
    })
    // assign inital peril & damage
    const perilModifier = 3;
    const initialPeril = data.stats.primaryAttributes[configOptions.pthAttribute].bonus + perilModifier;
    // get equipped armor
    const equippedArmor = actorData.items
      .filter(a => a.type === 'armor' && a.data.data.equipped);
    // calculate total damage threshold modifier from armor
    // according to the rule book, this doesn't stack, so we choose the maximium!
    // to account for shields with "maker's mark" quality, we need to implement active effects
    const damageModifier = Math.max(0, ...(equippedArmor.map(a => a.data.data.damageThresholdModifier.value)))
    const initialDamage = data.stats.primaryAttributes[configOptions.dthAttribute].bonus + damageModifier;
    // build ladder
    this.buildPerilDamageLadder(data, initialPeril, initialDamage);
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
        const primAttr = skill.data.data.associatedPrimaryAttribute.value.toLowerCase();
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
    const carriedTrappings = actorData.items.filter(i => i.type === 'trapping' && i.data.data.carried);
    const nine4one = game.settings.get("zweihander", "encumbranceNineForOne");
    const smallTrappingsEnc = !nine4one ? 0 : Math.floor(
      carriedTrappings
        .filter(t => t.data.data.encumbrance.value === 0)
        .map(t => t.data.data.quantity.value || 0)
        .reduce((a, b) => a + b, 0) / 9
    );
    const normalTrappingsEnc = carriedTrappings
      .filter(t => t.data.data.encumbrance.value !== 0)
      .map(t => t.data.data.encumbrance.value * (t.data.data.quantity.value || 0))
      .reduce((a, b) => a + b, 0);
    // assign encumbrance from coinage
    const coinageEnc = Math.floor(
      Object.entries(data.coinage).map(e => e[1]).reduce((a, b) => a + b, 0) / 1000
    );
    // assign encumbrance from equipped armor piece
    const armorEnc = equippedArmor
      .map(a => a.data.data.encumbrance.value)
      .reduce((a, b) => a + b, 0);
    // assign encumbrance from equipped weapons
    const weaponEnc = actorData.items
      .filter(i => i.type === 'weapon' && i.data.data.equipped)
      .map(w => w.data.data.encumbrance.value)
      .reduce((a, b) => a + b, 0);
    const enc = data.stats.secondaryAttributes.encumbrance = {};
    // assign initial encumbrance threshold
    enc.value = data.stats.primaryAttributes.brawn.bonus + 3 + configOptions.encumbranceModifier;
    // assign current encumbrance
    enc.current = smallTrappingsEnc + normalTrappingsEnc + coinageEnc
      + armorEnc + weaponEnc;
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

  async createEmbeddedDocuments(embeddedName, data, context, actor) {
    if (embeddedName === "Item") {
      const filteredData = [];
      let ancestryAttached = actor.data.items.some(i => i.type === 'ancestry');
      const actorProfessions = actor.data.items.filter(i => i.type === 'profession');
      let numberOfProfessionsAttached = actorProfessions.length;
      for (let item of data) {
        if (item.type === "profession") {
          const previousTiersCompleted = actorProfessions
            .map(profession => profession.data.data.tier.completed)
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