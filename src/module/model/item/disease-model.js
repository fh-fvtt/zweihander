import ZweihanderBaseItemModel from './base-item-model';

const { BooleanField, NumberField, SchemaField, StringField, TypedObjectField } = foundry.data.fields;

export default class ZweihanderDiseaseModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      active: new BooleanField({ initial: true }),
      duration: new SchemaField({
        value: new NumberField({ integer: true, initial: 0, min: 0 }),
        formula: new SchemaField(this._formulaFields),
        lastsUntilCured: new BooleanField({ initial: false }),
      }),
      resist: new NumberField({ integer: true, initial: 0, min: 0 }),
      rules: new SchemaField(this._effectFields),
    };
  }

  // ---=== SCHEMA GETTERS ===---

  /** @override */
  static get _effectFields() {
    return {
      ...super._effectFields,
      treatment: new TypedObjectField(new StringField({ initial: '' }), {
        validateKey: (key) => typeof key === 'string' && key.startsWith('@'),
      }),
    };
  }

  // ---=== MISC. METHODS ===---

  /** @override */
  async _preCreateWithParent(item, actor) {
    await super._preCreateWithParent(item, actor);

    if (item?.system?.duration?.value === 0 && !item?.system?.duration?.lastsUntilCured) {
      const formulaData = item.system.duration.formula;
      const { number, die, bonus } = formulaData;

      const roll = await new Roll(`${number}${die}+${bonus}`).evaluate();
      const speaker = ChatMessage.getSpeaker({ actor: actor });

      await roll.toMessage({ flavor: game.i18n.localize('ZWEI.othermessages.recuperationtime'), speaker });

      item.updateSource({ 'system.duration.value': roll.total });
    }
  }
}
