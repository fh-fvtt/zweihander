import ZweihanderBaseItem from './base-item';

export default class ZweihanderArmor extends ZweihanderBaseItem {
  async _preUpdate(changed, options, user, item) {
    if (changed.system['equipped'] !== undefined) {
      changed.system.equipped = changed.system.equipped && item.system.carried;
    }
    if (changed.system['carried'] !== undefined) {
      changed.system.equipped = item.system.equipped && changed.system.carried;
    }

    const currentlyActiveEffects = item.effects.filter((e) => e.system.isActive);

    // If Item is unequipped, disable all currently active Active Effects associated with it
    if (!changed.system.carried && currentlyActiveEffects.length) {
      for (let effect of currentlyActiveEffects) await effect.update({ ['system.isActive']: false });
    }

    await super._preUpdate(changed, options, user, item);
  }

  prepareDerivedData(item) {
    item.system.equipped = item.system.equipped && item.system.carried;
    item.system.qualities.arrayOfValues = item.system.qualities.value.split(', ').filter((x) => !!x.trim());
  }
}
