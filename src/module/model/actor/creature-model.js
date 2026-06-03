import ZweihanderBaseActorModel from './base-actor-model';
import ZweihanderActorConfig from '../../apps/actor-config';

const { NumberField, StringField, BooleanField, FilePathField, SchemaField, ArrayField, TypedObjectField } =
  foundry.data.fields;

const SKIP_EXTENSION = ['damageCurrent', 'perilCurrent'];

export default class ZweihanderCreatureModel extends ZweihanderBaseActorModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      languages: new ArrayField(this._languagesFields),
      skillRanks: new TypedObjectField(new NumberField({ integer: true, initial: 0, min: 0 }), {
        validateKey: (key) => typeof key === 'string' && key.trim().length > 0,
      }),
      details: new SchemaField({ ...this._detailsFields, riskFactor: new SchemaField(this._riskFactorFields) }),
    };
  }

  // ---=== SCHEMA GETTERS ===---

  /** @override */
  static get _statsFields() {
    return {
      ...super._statsFields,
      manualMode: new BooleanField({ initial: false }),
    };
  }

  /** @override */
  static get _primaryAttributeFields() {
    const secondaryAttributeFields = super._primaryAttributeFields;

    Object.values(secondaryAttributeFields).forEach((field) => {
      field.extendFields({
        bonusAdvances: new NumberField({ integer: true, initial: 0, min: 0 }),
      });
    });

    return secondaryAttributeFields;
  }

  /** @override */
  static get _secondaryAttributeFields() {
    const extendedSecondaryAttributes = Object.fromEntries(
      Object.entries(super._secondaryAttributeFields).map(([sa, field]) => {
        if (!SKIP_EXTENSION.includes(sa)) {
          field.extendFields({
            value: new NumberField({ integer: true, initial: 0 }),
          });
        }
        return [sa, field];
      })
    );

    return {
      ...extendedSecondaryAttributes,
      movement: new SchemaField({
        value: new NumberField({ integer: true, initial: 0, min: 0 }),
        fly: new NumberField({ integer: true, initial: 0, min: 0 }),
      }),
      initiative: new SchemaField({
        value: new NumberField({ integer: true, initial: 0, min: 0 }),
      }),
    };
  }

  /** @override */
  static get _detailsFields() {
    return {
      ...super._detailsFields,
      classification: new StringField({ initial: '' }),
      size: new NumberField({ integer: true, initial: 0, min: 0 }),
      role: new StringField({ initial: '' }),
      influences: new StringField({ initial: '' }),
    };
  }

  static get _settingsFields() {
    return {
      initiativeOverride: new NumberField({ integer: true, initial: 0 }),
      apModifier: new NumberField({ integer: true, initial: 0 }),
      dodgeSound: new FilePathField({
        categories: ['AUDIO'],
        initial: 'systems/zweihander/assets/sounds/dodge.mp3',
      }),
      parrySound: new FilePathField({
        categories: ['AUDIO'],
        initial: 'systems/zweihander/assets/sounds/parry.mp3',
      }),
      gruntSound: new FilePathField({
        categories: ['AUDIO'],
        initial: 'systems/zweihander/assets/sounds/grunt_m.mp3',
      }),
      playGruntSound: new BooleanField({ initial: true }),
    };
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const actor = this.parent;
    const configOptions = actor.system.settings;

    Object.values(actor.system.stats.primaryAttributes).forEach(
      (a) => (a.bonus = a.bonusAdvances + Math.floor(a.value / 10))
    );

    const sa = actor.system.stats.secondaryAttributes;
    const pa = actor.system.stats.primaryAttributes;

    sa.perilCurrent.effectiveValue = sa.perilCurrent.value;

    const dodgeSkillName = game.settings.get('zweihander', 'defaultCreatureDodgeSkill').toLowerCase();
    sa.dodge.associatedSkill = dodgeSkillName;

    const magickSkillName = game.settings.get('zweihander', 'defaultCreatureMagickSkill').toLowerCase();
    sa.magick.associatedSkill = magickSkillName;

    const combatBaseChance = pa.combat.value;
    const combatSkills = actor.items
      .filter((i) => i.type === 'skill' && i.system.associatedPrimaryAttribute.toLowerCase() === 'combat')
      .map((cs) => ({
        name: cs.name,
        chance: cs.system.bonus + combatBaseChance,
      }));

    const bestCombatSkill = combatSkills.reduce(
      (previous, current) => (previous && previous.chance > current.chance ? previous : current),
      null
    );

    sa.parry.associatedSkill = bestCombatSkill?.name ?? '';

    if (!actor.system.stats.manualMode) {
      // MG p. 239 "Parry (...) is equal to the highest Combat-based Skill the creature has (...)"
      sa.parry.value = bestCombatSkill?.chance ?? 0;

      const dodgeValue = actor.getSkillChance(actor.getItem('skill', dodgeSkillName));
      sa.dodge.value = dodgeValue;

      sa.initiative.value = 3 + pa.perception.bonus;

      sa.movement.value = 3 + pa.agility.bonus;
      sa.movement.fly = 3 + sa.movement.value;

      sa.perilThreshold.value = 3 + pa.willpower.bonus;
      sa.damageThreshold.value = pa.brawn.bonus;
    }

    sa.initiative.current = sa.initiative.value;
    sa.initiative.baseFormula = `${configOptions.initiativeOverride ? configOptions.initiativeOverride : 1}d10`;
  }
}
