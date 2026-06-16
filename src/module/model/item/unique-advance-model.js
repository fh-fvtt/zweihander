import ZweihanderBaseItemModel from './base-item-model';

const { BooleanField, DocumentUUIDField, NumberField, SchemaField, StringField } = foundry.data.fields;

export default class ZweihanderUniqueAdvanceModel extends ZweihanderBaseItemModel {
  static linkedSingleProperties = [
    { property: 'associatedTalent', itemType: 'talent' },
    { property: 'associatedTrait', itemType: 'trait' },
  ];

  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      advanceType: new StringField({ initial: 'focus' }),
      isReplacement: new BooleanField({ initial: false }),
      associatedTalent: new SchemaField({
        value: new DocumentUUIDField({ initial: '', blank: true }), //@todo this._linkedIdField...
        original: new DocumentUUIDField({ initial: '', blank: true }),
      }),
      associatedTrait: new DocumentUUIDField({ initial: '', blank: true }),
      associatedSpell: new DocumentUUIDField({ initial: '', blank: true }),
      associatedProfession: new DocumentUUIDField({ initial: '', blank: true }),
      associatedSkillRank: new SchemaField({
        value: new StringField({ initial: '' }),
        original: new StringField({ initial: '' }),
      }),
      associatedFocusSkill: new StringField({ initial: '' }),
      rewardPointCost: new NumberField({ integer: true, initial: 0, min: 0 }),
    };
  }
}
