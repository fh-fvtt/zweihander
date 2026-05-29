import * as CONFIG from '../../system/config';
import * as ZweihanderUtils from '../../system/utils';

import ZweihanderBaseItemModel from './base-item-model';

const { HTMLField, NumberField, SchemaField, StringField, TypedObjectField } = foundry.data.fields;

export default class ZweihanderRitualModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      channelAs: new StringField({ initial: '' }),
      castingTime: new SchemaField({
        setting: new StringField({ initial: 'formula' }),
        value: new StringField({ initial: '' }),
        number: new NumberField({ integer: true, initial: 0, min: 0 }),
        unit: new StringField({ initial: 'minutes' }),
      }),
      difficulty: new SchemaField({
        rating: new NumberField({ integer: true, initial: 0, min: 0 }),
        associatedSkill: new StringField({ initial: 'Incantation' }),
      }),
      rules: new SchemaField(this._effectFields),
    };
  }

  // ---=== SCHEMA GETTERS ===---

  /** @override */
  static get _effectFields() {
    const { condition, consequences, reagents } = Object.fromEntries(
      ['condition', 'consequences', 'reagents'].map((key) => [
        key,
        new TypedObjectField(new HTMLField({ initial: '' }), {
          validateKey: (key) => typeof key === 'string' && key.startsWith('@'),
        }),
      ])
    );

    return {
      ...super._effectFields,
      condition,
      consequences,
      reagents,
    };
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const item = this.parent;
    const itemData = item.system;

    let castingTimeFormula = '';

    if (itemData.castingTime.setting == 'formula') {
      castingTimeFormula = `${itemData.castingTime.number} ${itemData.castingTime.unit}`;
    } else {
      castingTimeFormula = game.i18n.localize(`ZWEI.actor.items.castingtimeList.${itemData.castingTime.setting}`);
    }

    itemData.castingTime.value = castingTimeFormula;

    if (!CONFIG.ZWEI.ritualDifficultyGeneric.includes(itemData.difficulty.rating))
      itemData.difficulty.value = `(${ZweihanderUtils.getDifficultyRatingLabel(itemData.difficulty.rating)}) ${
        itemData.difficulty.associatedSkill
      }`;
    else
      itemData.difficulty.value = game.i18n.localize(`ZWEI.actor.items.difficultyList.${itemData.difficulty.rating}`);
  }
}
