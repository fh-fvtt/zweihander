import ZweihanderBaseItemModel from './base-item-model';

import { normalizedEquals } from '../../system/utils';

const { BooleanField, NumberField, StringField } = foundry.data.fields;

export default class ZweihanderSkillModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      requiresTraining: new BooleanField({ initial: false }),
      associatedPrimaryAttribute: new StringField({ initial: '' }),
      bonusPerRank: new NumberField({ integer: true, initial: 0, min: 0 }),
    };
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareBaseData() {
    super.prepareBaseData();

    const item = this.parent;

    if (!item.isOwned || !item?.actor?.system) return;

    const actor = item.actor;

    if (actor.isCharacter) {
      item.system.rank =
        actor.itemTypes.profession.flatMap((p) =>
          p.system.effectiveSkillRanks?.filter?.((sr) => normalizedEquals(sr.name, item.name) && sr.purchased)
        )?.length ?? 0;
    } else {
      item.system.rank = actor.system.skillRanks?.[item.name] ?? 0;
    }

    item.system.bonus = item.system.rank * item.system.bonusPerRank;
    item.system.isFlipToFail = item.system.requiresTraining && item.system.rank === 0;
  }
}
