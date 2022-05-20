import ZweihanderBaseItem from './base-item';

export default class ZweihanderArmor extends ZweihanderBaseItem {
  async _preUpdate(changed, options, user, item) {
    if (changed.data['equipped'] !== undefined) {
      changed.data.equipped = changed.data.equipped && item.data.data.carried;
    }
    if (changed.data['carried'] !== undefined) {
      changed.data.equipped = item.data.data.equipped && changed.data.carried;
    }
    await super._preUpdate(changed, options, user, item);
  }

  prepareDerivedData(itemData) {
    itemData.data.equipped = itemData.data.equipped && itemData.data.carried;
    itemData.data.qualities.arrayOfValues = itemData.data.qualities.value
      .split(', ')
      .filter((x) => !!x.trim());
  }
}
