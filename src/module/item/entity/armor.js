import ZweihanderBaseItem from './base-item';

export default class ZweihanderArmor extends ZweihanderBaseItem {
  async _preUpdate(changed, options, user, item) {
    if (changed.system['equipped'] !== undefined) {
      changed.system.equipped = changed.system.equipped && item.system.carried;
    }
    if (changed.system['carried'] !== undefined) {
      changed.system.equipped = item.system.equipped && changed.system.carried;
    }
    await super._preUpdate(changed, options, user, item);
  }

  prepareDerivedData(item) {
    item.system.equipped = item.system.equipped && item.system.carried;
    item.system.qualities.arrayOfValues = item.system.qualities.value.split(', ').filter((x) => !!x.trim());
  }
}
