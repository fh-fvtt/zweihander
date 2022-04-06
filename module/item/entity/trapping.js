import ZweihanderBaseItem from "./base-item";

export default class ZweihanderTrapping extends ZweihanderBaseItem {

  async _preUpdate(changed, options, user, item) {
    if (changed.data['carried'] !== undefined) {
      changed.data.carried = changed.data.carried && item.data.data.quantity >= 1;
    }
    if (changed.data['quantity'] !== undefined) {
      changed.data.carried = item.data.data.carried && changed.data.quantity >= 1;
    }
    await super._preUpdate(changed, options, user, item);
  }

  prepareDerivedData(itemData) {
    itemData.data.carried = itemData.data.carried && itemData.data.quantity >= 1;
  }

}