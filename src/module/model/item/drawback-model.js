import ZweihanderBaseItemModel from './base-item-model';

const { SchemaField } = foundry.data.fields;

export default class ZweihanderDrawbackModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      rules: new SchemaField(this._effectFields),
    };
  }
}
