import { normalizeName } from '../../system/utils';
import * as CONFIG from '../../system/config';

const { ArrayField, BooleanField, FilePathField, HTMLField, NumberField, SchemaField, StringField, TypedObjectField } =
  foundry.data.fields;
const { TypeDataModel } = foundry.abstract;

export default class ZweihanderBaseActorModel extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      stats: new SchemaField(this._statsFields),
      settings: new SchemaField(this._settingsFields),
      description: new TypedObjectField(new HTMLField({ initial: '' }), {
        validateKey: (key) => typeof key === 'string' && key.startsWith('@'),
      }),
      notes: new TypedObjectField(new HTMLField({ initial: '' }), {
        validateKey: (key) => typeof key === 'string' && key.startsWith('@'),
      }),
    };
  }

  // ---=== SCHEMA GETTERS ===---

  static get _statsFields() {
    return {
      primaryAttributes: new SchemaField(this._primaryAttributeFields),
      secondaryAttributes: new SchemaField(this._secondaryAttributeFields),
    };
  }

  static get _primaryAttributeFields() {
    return CONFIG.ZWEI.primaryAttributes.reduce(
      (acc, cur) =>
        Object.assign(acc, {
          [cur]: new SchemaField({
            value: new NumberField({ integer: true, initial: 40, min: 0 }),
            bonus: new NumberField({ integer: true, initial: 0, persisted: false, min: 0 }),
          }),
        }),
      {}
    );
  }

  static get _secondaryAttributeFields() {
    return {
      perilCurrent: new SchemaField({
        value: new NumberField({ integer: true, initial: 5, min: 0 }),
        max: new NumberField({ integer: true, initial: 5, min: 0 }),
      }),
      damageCurrent: new SchemaField({
        value: new NumberField({ integer: true, initial: 5, min: 0 }),
        max: new NumberField({ integer: true, initial: 5, min: 0 }),
      }),
      perilThreshold: new SchemaField({
        value: new NumberField({ integer: true, initial: 0, persisted: false, min: 0 }),
      }),
      damageThreshold: new SchemaField({
        value: new NumberField({ integer: true, initial: 0, persisted: false, min: 0 }),
        dtm: new NumberField({ integer: true, initial: 0, persisted: false, min: 0 }),
      }),
      parry: new SchemaField({
        associatedSkill: new StringField({ initial: 'Simple Melee' }),
      }),
      dodge: new SchemaField({
        associatedSkill: new StringField({ initial: 'Coordination' }),
      }),
      magick: new SchemaField({
        associatedSkill: new StringField({ initial: 'Incantation' }),
      }),
      madness: new SchemaField({
        associatedSkill: new StringField({ initial: 'Resolve' }),
      }),
    };
  }

  static get _detailsFields() {
    return {};
  }

  static get _riskFactorFields() {
    return {
      value: new NumberField({ integer: true, initial: 0, min: 0 }),
      notch: new NumberField({ integer: true, initial: 0, min: 0 }),
    };
  }

  static get _languagesFields() {
    return new SchemaField({
      name: new StringField({ initial: 'New Language' }),
      isLiterate: new BooleanField({ initial: false }),
    });
  }

  static get _currencyFields() {
    return new NumberField({ integer: true, initial: 0, nullable: false, min: 0 });
  }

  static get _settingsFields() {
    const getDefaultSkills = (packName) =>
      game.settings
        .get('zweihander', packName)
        .split(',')
        .map((s) => s.trim());

    return {
      dthAttribute: new StringField({ initial: 'brawn' }),
      pthAttribute: new StringField({ initial: 'willpower' }),
      intAttribute: new StringField({ initial: 'perception' }),
      movAttribute: new StringField({ initial: 'agility' }),
      // @todo: refactor this ugly-ass field into something easier to work with
      isIgnoredPerilLadderValue: new ArrayField(new BooleanField({ initial: false }), {
        initial: [false, false, false],
        min: 3,
        max: 3,
      }),
      encumbranceModifier: new NumberField({ integer: true, initial: 0 }),
      initiativeModifier: new NumberField({ integer: true, initial: 0 }),
      initiativeOverride: new NumberField({ integer: true, initial: 0 }),
      movementModifier: new NumberField({ integer: true, initial: 0 }),
      parrySkills: new ArrayField(new StringField({ initial: null, nullable: true }), {
        initial: getDefaultSkills('defaultParrySkills'),
      }),
      dodgeSkills: new ArrayField(new StringField({ initial: null, nullable: true }), {
        initial: getDefaultSkills('defaultDodgeSkills'),
      }),
      magickSkills: new ArrayField(new StringField({ initial: null, nullable: true }), {
        initial: getDefaultSkills('defaultMagickSkills'),
      }),
      perilSkills: new ArrayField(new StringField({ initial: null, nullable: true }), {
        initial: getDefaultSkills('defaultPerilSkills'),
      }),
      isMagickUser: new BooleanField({ initial: false }),
      permanentChaosRanks: new NumberField({ integer: true, initial: 0, min: 0 }),
      permanentOrderRanks: new NumberField({ integer: true, initial: 0, min: 0 }),
      headerBackground: new FilePathField({
        categories: ['IMAGE'],
        initial: 'systems/zweihander/assets/default-header-bg.webp',
        blank: true,
      }),
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
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const actor = this.parent;

    if (!actor.img || CONFIG.ZWEI.replacedDefaultCoreIcons.includes(actor.img)) {
      const img = CONFIG.ZWEI.defaultActorIcons[actor.type] ?? CONFIG.ZWEI.defaultActorIcons._default;
      await actor.updateSource({ img });
    }

    if (actor.type !== 'vehicle') {
      // add default set of skills to Characters, Creatures, and NPCs
      const skillPack = game.packs.get(game.settings.get('zweihander', 'skillPack'));
      const skillsFromPack = (await skillPack.getDocuments())
        .sort((a, b) => {
          const normalizedA = normalizeName(a.name);
          const normalizedB = normalizeName(b.name);

          if (normalizedA < normalizedB) return -1;
          if (normalizedA > normalizedB) return 1;
          return 0;
        })
        .map((i) => i.toObject());
      await actor.updateSource({ items: skillsFromPack }, { keepId: true, keepEmbeddedIds: true });
    }
  }
}
