import ZweihanderBaseItemModel from './base-item-model';

const { ArrayField, NumberField, SchemaField, StringField } = foundry.data.fields;

export default class ZweihanderAncestryModel extends ZweihanderBaseItemModel {
  static linkedSingleProperties = [{ property: 'ancestralTrait', itemType: 'trait' }];

  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      ancestralModifiers: new SchemaField({
        value: new ArrayField(
          new SchemaField({
            key: new StringField({ initial: '[CB]' }),
            value: new NumberField({ integer: true, initial: 0 }),
          })
        ),
        positive: new ArrayField(new StringField({ persisted: false })),
        negative: new ArrayField(new StringField({ persisted: false })),
      }),
      ancestralTrait: new SchemaField(this._linkedDocumentFields),
    };
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const item = this.parent;
    const itemData = item.system;

    const ancestralModifiers = itemData.ancestralModifiers.value;

    if (ancestralModifiers.length) {
      let toAddPositive = [];
      let toAddNegative = [];

      for (const modifier of ancestralModifiers) {
        if (modifier.value == 0) continue;

        const toAdd = Array(Math.abs(modifier.value)).fill(modifier.key);

        if (modifier.value > 0) toAddPositive = toAddPositive.concat(toAdd);
        else toAddNegative = toAddNegative.concat(toAdd);
      }

      itemData.ancestralModifiers.positive = toAddPositive;
      itemData.ancestralModifiers.negative = toAddNegative;
    }
  }

  // ---=== MISC. METHODS ===---

  /** @override */
  async _preCreateWithParent(item, actor) {
    await super._preCreateWithParent(item, actor);

    if (actor.itemTypes.ancestry.length) {
      ui.notifications.error(game.i18n.localize('ZWEI.othermessages.errorancestry'));
      return false;
    }
  }
}
