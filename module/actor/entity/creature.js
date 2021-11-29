import ZweihanderBaseActor from "./base-actor";
import * as ZweihanderUtils from "../../utils";

export default class ZweihanderCreature extends ZweihanderBaseActor {

  prepareEmbeddedEntities(actorData) {
    const weapons = [];
    const ancestry = [];
    const spells = [];
    const rituals = [];
    const skills = [];
    const talents = [];
    const traits = [];
    const trappings = [];
    const injuries = [];
    const conditions = [];

    for (let item of actorData.items.values()) {
      if (item.type === "weapon")
        weapons.push(item.data);
      else if (item.type === "ancestry")
        ancestry.push(item.data);
      else if (item.type === "spell")
        spells.push(item.data);
      else if (item.type === "ritual")
        rituals.push(item.data);
      else if (item.type === "skill")  // TODO: Don't allow duplicate Skills -- !skills.some(skill => skill.name === item.name)
        skills.push(item.data);
      else if (item.type === "talent")
        talents.push(item.data);
      else if (item.type === "trait")
        traits.push(item.data);
      else if (item.type === "trapping")
        trappings.push(item.data);
      else if (item.type === "injury")
        injuries.push(item.data);
      else if (item.type === "condition")
        conditions.push(item.data);
    }

    actorData.weapons = weapons;
    actorData.ancestry = ancestry;
    actorData.spells = spells;
    actorData.rituals = rituals;

    actorData.skills = skills.sort((skillA, skillB) => {
      const nameA = skillA.name;
      const nameB = skillB.name;

      if (nameA < nameB) {
        return -1;
      }

      if (nameA > nameB) {
        return 1;
      }

      return 0;
    });

    actorData.talents = talents;
    actorData.traits = traits;
    actorData.trappings = trappings;
    actorData.injuries = injuries;
    actorData.conditions = conditions;

  }

  getRollData(rollData) {
    //TODO: make attributes more accessible here
    return rollData;
  }

  prepareDerivedData(actorData) {
    const data = actorData.data;

    // Assign Peril Threshold values
    let initialPeril = data.stats.primaryAttributes.willpower.bonus, perilModifier = 3;

    const perilArray = Object.keys(data.stats.secondaryAttributes.perilThreshold);

    perilArray.forEach((v) => {
      data.stats.secondaryAttributes.perilThreshold[v] = initialPeril + perilModifier;
      perilModifier += 6;
    })


    // Assign Damage Threshold values
    let initialDamage = data.stats.primaryAttributes.brawn.bonus, damageModifier = 6;

    const damageArray = Object.keys(data.stats.secondaryAttributes.damageThreshold);

    data.stats.secondaryAttributes.damageThreshold[damageArray[0]] = initialDamage;

    for (let i = 1; i < damageArray.length; i++)
      data.stats.secondaryAttributes.damageThreshold[damageArray[i]] = initialDamage += damageModifier;
  }

}