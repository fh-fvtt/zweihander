import ZweihanderBaseItem from './base-item';

export default class ZweihanderTrapping extends ZweihanderBaseItem {
  async _preUpdate(changed, options, user, item) {
    if (changed.system['carried'] !== undefined) {
      changed.system.carried =
        changed.system.carried && item.system.quantity >= 1;
    }
    if (changed.system['quantity'] !== undefined) {
      changed.system.carried =
        item.system.carried && changed.system.quantity >= 1;
    }
    await super._preUpdate(changed, options, user, item);
  }

  prepareDerivedData(item) {
    item.system.carried =
      item.system.carried && item.system.quantity >= 1;
  }
}
