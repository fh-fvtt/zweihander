import ZweihanderBaseActor from "./base-actor";
import * as ZweihanderUtils from "../../utils";
import ZweihanderActorConfig from "../../apps/actor-config";

export default class ZweihanderPC extends ZweihanderBaseActor {

  prepareBaseData(actorData, that) {

  }

  prepareEmbeddedEntities(actorData) {
    // set up collections for all item types
    const indexedTypes = [
      "trapping", "condition", "injury", "disease", "disorder", "profession",
      "ancestry", "armor", "weapon", "spell", "ritual", "talent", "trait",
      "drawback", "quality", "skill", "uniqueAdvance"
    ];
    const pluralize = t => ({
      'injury': 'injuries',
      'ancestry': 'ancestry',
      'armor': 'armor',
      'quality': 'qualities'
    }[t] ?? t + "s");
    indexedTypes.forEach(t => actorData[pluralize(t)] = []);
    actorData.items
      .filter(i => indexedTypes.includes(i.type))
      .forEach(i => actorData[pluralize(i.type)].push(i.toObject(false)));
    // sort skills
    actorData.skills = actorData.skills.sort((a, b) => a.name.localeCompare(b.name));
    // enrich drawback data to distinguish between drawbacks gained through professions and drawbacks bought
    // this is unfortunately not robust but I don't see a way to make it robust without bloating the data model
    //TODO: move to derivedData (or better even to item classes)
  }
  prepareDerivedData(actorData) {
    const noWarn = actorData._id === null;
    const configOptions = ZweihanderActorConfig.getConfig(actorData);
    // set up utility variables
    const data = actorData.data;
    const derived = {};
    data.derived = derived;
    // calculate reward points automatically
    if (game.settings.get("zweihander", "trackRewardPoints")) {
      const tierMultiplier = {
        "Basic": 100,
        "Intermediate": 200,
        "Advanced": 300
      }
      data.rewardPoints.spent = actorData.professions
        .map(profession => tierMultiplier[profession.data.tier.value] * profession.data.tier.advancesPurchased)
        .concat(actorData.uniqueAdvances.map(advance => advance.data.rewardPointCost.value))
        .reduce((a, b) => a + b, 0);
      data.rewardPoints.current = data.rewardPoints.total - data.rewardPoints.spent;
    }
    data.tier = actorData.professions[actorData.professions.length-1]?.data.tier.value ?? '';
    // calculate primary attribute bonuses (first digit)
    Object.values(data.stats.primaryAttributes).forEach(a => a.bonus = Math.floor(a.value / 10));
    // add ancestral modifiers to the primary attribute bonuses
    const ancestry = actorData.ancestry[0];
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
      applyBonusModifiers(ancestry.data.ancestralModifiers.positive, +1, `ancestry ${ancestry.name} of actor ${actorData.name}`);
      applyBonusModifiers(ancestry.data.ancestralModifiers.negative, -1, `ancestry ${ancestry.name} of actor ${actorData.name}`);
    }
    // professional bonus advances
    actorData.professions.forEach(p => {
      const advancesList = p.data.bonusAdvances?.filter?.(a => a.purchased)?.map?.(a => a.value) ?? [];
      applyBonusModifiers(advancesList, +1, `profession ${p.name} of actor ${actorData.name}`);
    })
    // get equipped armor
    const equippedArmor = actorData.armor
      .filter(a => a.data.equipped)
    // calculate total damage threshold modifier from armor
    // according to the rule book, this doesn't stack, so we choose the maximium!
    // to account for shields with "maker's mark" quality, we need to implement active effects
    data.derived.dtm = Math.max(0, ...(equippedArmor.map(a => a.data.damageThresholdModifier.value)))
    // assign inital peril & damage
    let perilModifier = 3;
    let initialPeril = data.stats.primaryAttributes[configOptions.pthAttribute].bonus + perilModifier;
    let damageModifier = data.derived.dtm;
    let initialDamage = data.stats.primaryAttributes[configOptions.dthAttribute].bonus + damageModifier;
    // build ladder
    this.buildPerilDamageLadder(data, initialPeril, initialDamage);
    // get peril malus
    const basePerilCurrent = data.stats.secondaryAttributes.perilCurrent.value
    const effectivePerilCurrent = this.getEffectivePerilLadderValue(basePerilCurrent, configOptions.isIgnoredPerilLadderValue);
    data.stats.secondaryAttributes.perilCurrent.effectiveValue = effectivePerilCurrent;
    const perilMalus = this.getPerilMalus(effectivePerilCurrent);
    // calculate special actions underlying values
    const calcSecondayAttributeSpecialActionValue = (secAttr, name) => {
      const item = actorData.skills.find(skill => skill.name === secAttr.associatedSkill);
      if (item) {
        const primAttr = item.data.associatedPrimaryAttribute.value.toLowerCase();
        secAttr.value = data.stats.primaryAttributes[primAttr].value + Math.max(0, item.data.bonus - perilMalus);
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
    const carriedTrappings = actorData.trappings.filter(t => t.data.carried);
    const nine4one = game.settings.get("zweihander", "encumbranceNineForOne");
    const smallTrappingsEnc = !nine4one ? 0 : Math.floor(
      carriedTrappings
        .filter(t => t.data.encumbrance.value === 0)
        .map(t => t.data.quantity.value)
        .reduce((a, b) => a + b, 0) / 9
    );
    const normalTrappingsEnc = carriedTrappings
      .filter(t => t.data.encumbrance.value !== 0)
      .map(t => t.data.encumbrance.value * t.data.quantity.value)
      .reduce((a, b) => a + b, 0);
    // assign encumbrance from coinage
    const coinageEnc = Math.floor(
      Object.entries(data.coinage).map(e => e[1]).reduce((a, b) => a + b, 0) / 1000
    );
    // assign encumbrance from equipped armor piece
    const armorEnc = equippedArmor
      .map(a => a.data.encumbrance.value)
      .reduce((a, b) => a + b, 0);
    // assign encumbrance from equipped weapons
    const weaponEnc = actorData.weapons
      .filter(w => w.data.equipped)
      .map(w => w.data.encumbrance.value)
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
    //TODO: this should be done in items!
    for (let armor of actorData.armor) armor.data.qualities.arrayOfValues = armor.data.qualities.value.split(", ");
    for (let weapon of actorData.weapons) weapon.data.qualities.arrayOfValues = weapon.data.qualities.value.split(", ");
  }

  getRollData(rollData) {
    //TODO: make attributes more accessible here
    return rollData;
  }

  async _preCreate(actorData, options, user, that) {
    const skillPack = game.packs.get("zweihander.skills");
    const skillsFromPack = (await skillPack.getDocuments()).map(item => item.toObject());
    const skillsFromActor = actorData.skills;
    // add default set of skills while preventing duplicate skills
    const symmetricDifferenceIds = ZweihanderUtils.getSymmetricDifference(skillsFromPack.map(i => i._id), skillsFromActor.map(i => i._id));
    if (symmetricDifference.length) {
      const itemsToAdd = [...skillsFromActor, ...skillsFromPack].filter(item => symmetricDifferenceIds.includes(item._id));
      actorData.update({ "items": symmetricDifference });
    }
  }

}