import ZweihanderBaseItem from "./base-item";
import { rollTest } from "../../dice";
import { getItemRollConfiguration } from "../../apps/test-config";

export default class ZweihanderWeapon extends ZweihanderBaseItem {

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
    itemData.data.qualities.arrayOfValues = itemData.data.qualities.value.split(", ").filter(x => !!x.trim());
  }

  async roll(item) {
    const { skillItem, additionalConfiguration } = getItemRollConfiguration(item);

    await rollTest(skillItem, 'weapon', additionalConfiguration, { showDialog: true });
  }

}