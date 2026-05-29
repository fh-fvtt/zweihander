import ZweihanderBaseItemModel from './base-item-model';

const { BooleanField, HTMLField, NumberField, StringField, SchemaField, TypedObjectField } = foundry.data.fields;

export default class ZweihanderSpellModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      castingCost: new NumberField({ integer: true, initial: 0, min: 0 }),
      castingTime: new StringField({ initial: '1 min' }),
      distance: new StringField({ initial: '' }),
      duration: new SchemaField({
        value: new StringField({ initial: 'instantaneous' }),
        label: new StringField({ initial: 'Instantaneous' }),
        formula: new SchemaField({
          override: new BooleanField({ initial: false }),
        }),
        base: new StringField({ initial: '[WB]' }),
        bonus: new NumberField({ integer: true, initial: 0 }),
        unit: new StringField({ initial: 'minutes' }),
      }),
      principle: new StringField({ initial: '' }),
      tradition: new StringField({ initial: '' }),
      rules: new SchemaField(this._effectFields),
    };
  }

  // ---=== SCHEMA GETTERS ===---

  /** @override */
  static get _effectFields() {
    const { criticalSuccess, criticalFailure, reagents } = Object.fromEntries(
      ['criticalSuccess', 'criticalFailure', 'reagents'].map((key) => [
        key,
        new TypedObjectField(new HTMLField({ initial: '' }), {
          validateKey: (key) => typeof key === 'string' && key.startsWith('@'),
        }),
      ])
    );

    return {
      ...super._effectFields,
      criticalFailure,
      criticalSuccess,
      reagents,
    };
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const item = this.parent;
    const itemData = item.system;

    let durationFormula = '';

    if (itemData.duration.formula.override) {
      const governingDurationAttribute = itemData.duration?.base ? itemData.duration.base : '[WB]';

      durationFormula = `${governingDurationAttribute} + ${itemData.duration.bonus} ${itemData.duration.unit}`;
    } else {
      durationFormula = game.i18n.localize(`ZWEI.actor.items.durationList.${itemData.duration.value}`);
    }

    itemData.duration.label = durationFormula;
  }
}
