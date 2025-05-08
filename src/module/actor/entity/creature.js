import ZweihanderBaseActor from './base-actor';
import * as ZweihanderUtils from '../../utils';

export default class ZweihanderCreature extends ZweihanderBaseActor {
  prepareBaseData(actor) {
    actor.system.stats.secondaryAttributes.dodge.associatedSkill = game.settings.get(
      'zweihander',
      'defaultCreatureDodgeSkill'
    );
  }

  prepareDerivedData(actor) {
    Object.values(actor.system.stats.primaryAttributes).forEach(
      (a) => (a.bonus = a.bonusAdvances + Math.floor(a.value / 10))
    );
    const sa = actor.system.stats.secondaryAttributes;
    const pa = actor.system.stats.primaryAttributes;
    sa.perilCurrent.effectiveValue = sa.perilCurrent.value;
    if (!actor.system.stats.manualMode) {
      // main gauche p. 239 "Parry (abbreviated to Par in the Bestiary) is equal to the highest Combat-based Skill the creature has"
      const combatBaseChance = pa.combat.value;
      const combatSkills = actor.items.filter(
        (i) => i.type === 'skill' && i.system.associatedPrimaryAttribute.toLowerCase() === 'combat'
      );
      sa.parry.value = Math.max(...combatSkills.map((s) => s.system.bonus + combatBaseChance));
      // dodge is equal to its coordination (or custom skill) value
      const dodgeSkillName = game.settings.get('zweihander', 'defaultCreatureDodgeSkill').toLowerCase();
      const dodgeValue = this.getSkillChance(actor, this.getItem(actor, 'skill', dodgeSkillName));
      sa.dodge.value = dodgeValue;
      sa.initiative.value = 3 + pa.perception.bonus;
      sa.movement.value = 3 + pa.agility.bonus;
      sa.movement.fly = 3 + sa.movement.value;
      sa.perilThreshold.value = 3 + pa.willpower.bonus;
      sa.damageThreshold.value = pa.brawn.bonus;
    }
  }

  getItem(actor, type, name, strict = false) {
    return actor.items.find(
      (i) => i.type === type && (strict ? i.name === name : ZweihanderUtils.normalizedEquals(i.name, name))
    );
  }

  getSkillChance(actor, skill) {
    if (!skill) return 0;
    const pa = skill.system.associatedPrimaryAttribute.toLowerCase();
    const paChance = actor.system.stats.primaryAttributes[pa].value;
    const skillBonus = skill.system.bonus;
    return paChance + skillBonus;
  }
}
