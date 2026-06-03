const { ActiveEffectTypeDataModel } = foundry.data;
const { BooleanField, SchemaField, StringField } = foundry.data.fields;

export default class ZweihanderActiveEffectModel extends ActiveEffectTypeDataModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      details: new SchemaField({
        source: new StringField({ initial: '' }),
      }),
    };
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const changes = this.changes;
    const phases = {
      ...CONFIG.ZWEI.primaryAttributePhases,
      ...CONFIG.ZWEI.primaryAttributeBonusPhases,
      ...CONFIG.ZWEI.secondaryAttributePhases,
      ...CONFIG.ZWEI.combatPhases,
    };

    for (let change of changes) {
      change.phase = phases[change.key] ?? 'initial';
    }
  }

  /** @override */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    if (!data.statuses) return;

    const hasCreatedTime = !!data._stats?.createdTime;
    const updateData = {};

    updateData['system.details.source'] = hasCreatedTime
      ? _loc('TYPES.Item.manual')
      : `${data.name} (${_loc('EFFECT.statuseffect')})`;

    this.parent.updateSource(updateData);
  }
}
