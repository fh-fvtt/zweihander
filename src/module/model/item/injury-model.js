import ZweihanderBaseItemModel from './base-item-model';

const { BooleanField, NumberField, SchemaField } = foundry.data.fields;

export default class ZweihanderInjuryModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      active: new BooleanField({ initial: true }),
      recuperationTime: new NumberField({ integer: true, initial: 0, min: 0 }),
      rules: new SchemaField(this._effectFields),
      severity: new NumberField({ integer: true, initial: 0, min: 0 }),
    };
  }

  // ---=== MISC. METHODS ===---

  /** @override */
  async _preCreateWithParent(item, actor) {
    await super._preCreateWithParent(item, actor);

    if (item?.system?.recuperationTime === 0) {
      const d = Number(item.system.severity) + 1;
      const roll = await new Roll(`${d}d10+${d}`).evaluate();
      const speaker = ChatMessage.getSpeaker({ actor: actor });

      await roll.toMessage({ flavor: game.i18n.localize('ZWEI.othermessages.recuperationtime'), speaker });

      item.updateSource({ 'system.recuperationTime': roll.total });
    }
  }
}
