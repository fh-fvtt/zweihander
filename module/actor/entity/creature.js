import ZweihanderBaseActor from "./base-actor";
import * as ZweihanderUtils from "../../utils";

export default class ZweihanderCreature extends ZweihanderBaseActor {

  prepareDerivedData(actorData, actor) {
    Object.values(actorData.data.stats.primaryAttributes)
      .forEach(a => a.bonus = a.bonusAdvances + Math.floor(a.value / 10));
    const sa = actorData.data.stats.secondaryAttributes;
    const pa = actorData.data.stats.primaryAttributes;
    sa.perilCurrent.effectiveValue = sa.perilCurrent.value;
    if (!actorData.data.stats.manualMode) {
      // main gauche p. 239 "Parry (abbreviated to Par in the Bestiary) is equal to the highest Combat-based Skill the creature has"
      const combatBaseChance = pa.combat.value;
      const combatSkills = actorData.items.filter(i =>
        i.type === 'skill' && i.data.data.associatedPrimaryAttribute.toLowerCase() === 'combat');
      sa.parry.value = Math.max(...combatSkills.map(s => s.data.data.bonus + combatBaseChance));
      // dodge is equal to its coordination value
      const coordinationValue = this.getSkillChance(actor, this.getItem(actor, 'skill', 'coordination'));
      sa.dodge.value = coordinationValue;
      sa.initiative.value = 3 + pa.perception.bonus;
      sa.movement.value = 3 + pa.agility.bonus;
      sa.movement.fly = 3 + sa.movement.value;
      sa.perilThreshold.value = 3 + pa.willpower.bonus;
      sa.damageThreshold.value = pa.brawn.bonus;
    }
  }

  getItem(actor, type, name, strict = false) {
    return actor.items.find(i => i.type === type &&
      (strict ? i.name === name : ZweihanderUtils.normalizedEquals(i.name, name)));
  }

  getSkillChance(actor, skill) {
    if (!skill) return 0;
    const pa = skill.data.data.associatedPrimaryAttribute.toLowerCase();
    const paChance = actor.data.data.stats.primaryAttributes[pa].value;
    const skillBonus = skill.data.data.bonus;
    return paChance + skillBonus;
  }

}