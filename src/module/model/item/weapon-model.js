import * as ZweihanderUtils from '../../system/utils';

import ZweihanderBaseItemModel from './base-item-model';

const { ArrayField, BooleanField, DocumentUUIDField, NumberField, StringField, SchemaField } = foundry.data.fields;

export default class ZweihanderWeaponModel extends ZweihanderBaseItemModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      ...super._trappingFields,
      associatedSkill: new StringField({ initial: 'Simple Melee' }),
      damage: new SchemaField({
        attributeBonus: new StringField({ initial: '[CB]' }),
        formula: new SchemaField({
          override: new BooleanField({ initial: false }),
          value: new StringField({ initial: '[CB] + 0 + (1+[#])d6x6' }),
        }),
        fury: new SchemaField({
          explodesOn: new ArrayField(new StringField({ initial: '' })),
          value: new BooleanField({ initial: false }),
        }),
        ...super._formulaFields,
      }),
      distance: new SchemaField({
        base: new StringField({ initial: '[PB]' }),
        bonus: new NumberField({ integer: true, initial: 0 }),
        value: new StringField({ initial: '' }),
      }),
      equipped: new BooleanField({ initial: true }),
      handling: new StringField({ initial: 'One-Handed' }),
      ranged: new SchemaField({
        load: new NumberField({ integer: true, initial: 0, min: 0 }),
        value: new BooleanField({ initial: false }),
      }),
      qualities: new ArrayField(new DocumentUUIDField({ initial: '', blank: true })),
      weaponType: new StringField({ initial: '' }),
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

    let distanceFormula = '';

    if (itemData.ranged.value) {
      const governingDistanceAttribute =
        typeof itemData.distance?.base !== 'undefined' ? itemData.distance.base : '[PB]';

      distanceFormula =
        `${governingDistanceAttribute} + ${itemData.distance.bonus} ` +
        game.i18n.localize('ZWEI.actor.details.labels.yardabbr');
    } else {
      distanceFormula =
        game.i18n.localize('ZWEI.actor.items.engaged') +
        `${
          itemData.distance.bonus
            ? ' ' +
              game.i18n.localize('ZWEI.actor.items.or') +
              ' ' +
              itemData.distance.bonus +
              ' ' +
              game.i18n.localize('ZWEI.actor.details.labels.yardabbr')
            : ''
        }`;
    }

    itemData.distance.value = distanceFormula;
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

    // if weapon is unequipped, disable all currently active Active Effects associated with it
    if (!changed.system.carried && currentlyActiveEffects.length) {
      for (let effect of currentlyActiveEffects) await effect.update({ ['disabled']: true });
    }
  }
}
