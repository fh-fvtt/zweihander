import ZweihanderBaseItemModel from './base-item-model';

const { NumberField, SchemaField } = foundry.data.fields;

export default class ZweihanderTrappingModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      ...super._trappingFields,
      details: new SchemaField(this._detailsFields),
      quantity: new NumberField({ integer: true, initial: 0, min: 0 }),
      rules: new SchemaField(this._effectFields),
    };
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const item = this.parent;
    const itemData = item.system;

    itemData.carried = itemData.carried && itemData.quantity >= 1;
  }

  /** @override */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    const item = this.parent;

    // re-render Active Effects associated with this Trapping if their sheets are open
    if (changed.system?.carried !== undefined) {
      const currentlyRenderedEffects = item.effects.filter((e) => e.sheet.rendered);
      currentlyRenderedEffects.forEach(async (e) => await e.sheet.render(true));
    }
  }

  // ---=== MISC. METHODS ===---

  /** @override */
  async _preUpdateWithParent(changed, item, actor) {
    await super._preUpdateWithParent(changed, item, actor);

    if (changed.system.carried !== undefined) {
      changed.system.carried = changed.system.carried && item.system.quantity >= 1;
    }

    if (changed.system.quantity !== undefined) {
      changed.system.carried = item.system.carried && changed.system.quantity >= 1;
    }

    const currentlyActiveEffects = item.effects.filter((e) => e.active);

    // if trapping is unequipped, disable all currently active Active Effects associated with it
    if (!changed.system.carried && currentlyActiveEffects.length) {
      for (let effect of currentlyActiveEffects) await effect.update({ disabled: true }, { render: true });
    }
  }
}
