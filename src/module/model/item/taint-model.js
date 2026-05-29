import ZweihanderBaseItemModel from './base-item-model';

const { BooleanField, SchemaField } = foundry.data.fields;

export default class ZweihanderTaintModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      active: new BooleanField({ initial: true }),
      details: new SchemaField(this._detailsFields),
      rules: new SchemaField(this._effectFields),
    };
  }
}
