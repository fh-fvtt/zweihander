import ZweihanderBaseItemModel from './base-item-model';

const { NumberField, StringField } = foundry.data.fields;

export default class ZweihanderUniqueAdvanceModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      advanceType: new StringField({ initial: '' }),
      associatedFocusSkill: new StringField({ initial: '' }),
      rewardPointCost: new NumberField({ integer: true, initial: 0, min: 0 }),
    };
  }
}
