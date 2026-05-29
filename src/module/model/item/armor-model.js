import * as ZweihanderUtils from '../../system/utils';

import ZweihanderBaseItemModel from './base-item-model';

const { BooleanField, ArrayField, NumberField } = foundry.data.fields;

export default class ZweihanderArmorModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      ...super._trappingFields,
      equipped: new BooleanField({ initial: true }),
      qualities: new ArrayField(this._qualitiesFields),
      damageThresholdModifier: new NumberField({ integer: true, initial: 0, min: 0 }),
    };
  }

  // ---=== HELPER METHODS ===---

  async getQualitiesData() {
    const qualities = this.qualities;

    return await Promise.all(
      qualities.map(async (uuid) => {
        const qualityItem = await fromUuid(uuid);

        return {
          name: qualityItem?.name,
          found: qualityItem !== undefined,
          effect: ZweihanderUtils.localize(qualityItem?.system?.rules?.effect),
        };
      })
    );
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const item = this.parent;
    const itemData = item.system;

    itemData.equipped = itemData.equipped && itemData.carried;
  }

  // ---=== MISC. METHODS ===---

  /** @override */
  async _preUpdateWithParent(changed, item, actor) {
    await super._preUpdateWithParent(changed, item, actor);

    if (changed.system.equipped !== undefined) {
      changed.system.equipped = changed.system.equipped && item.system.carried;
    }

    if (changed.system.carried !== undefined) {
      changed.system.equipped = item.system.equipped && changed.system.carried;
    }

    const currentlyActiveEffects = item.effects.filter((e) => e.active);

    // if armor is unequipped, disable all currently active Active Effects associated with it
    if (!changed.system.carried && currentlyActiveEffects.length) {
      for (let effect of currentlyActiveEffects) await effect.update({ disabled: true }, { render: true });
    }
  }
}
