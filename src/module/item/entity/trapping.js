import ZweihanderBaseItem from './base-item';

export default class ZweihanderTrapping extends ZweihanderBaseItem {
  async _preUpdate(changed, options, user, item) {
    if (changed.system['carried'] !== undefined) {
      changed.system.carried = changed.system.carried && item.system.quantity >= 1;
    }

    if (changed.system['quantity'] !== undefined) {
      changed.system.carried = item.system.carried && changed.system.quantity >= 1;
    }

    const currentlyActiveEffects = item.effects.filter((e) => e.system.isActive);

    // If Item is unequipped, disable all currently active Active Effects associated with it
    if (!changed.system.carried && currentlyActiveEffects.length) {
      for (let effect of currentlyActiveEffects) await effect.update({ ['system.isActive']: false });
    }

    await super._preUpdate(changed, options, user, item);
  }

  prepareDerivedData(item) {
    item.system.carried = item.system.carried && item.system.quantity >= 1;
  }
}
