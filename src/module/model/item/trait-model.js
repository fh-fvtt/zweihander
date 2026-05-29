import ZweihanderBaseItemModel from './base-item-model';

const { SchemaField, StringField } = foundry.data.fields;

export default class ZweihanderTraitModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      category: new StringField({ initial: '' }),
      rules: new SchemaField(this._effectFields),
    };
  }
}
