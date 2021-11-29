import ZweihanderBaseItem from "./base-item";
import * as ZweihanderUtils from "../../utils";

export default class ZweihanderSkill extends ZweihanderBaseItem {

  prepareBaseData(itemData, item) {
    if (!item.isOwned || !item?.actor?.data) return;
    const data = itemData.data;
    const actor = item.actor;
    const timesPurchased = actor.items
      .filter(i => i.type === 'profession')
      .flatMap(p => p.data.data.skillRanks.filter(sr => sr.value === item.name && sr.purchased))
      .length;
    data.rank = timesPurchased;
    data.bonus = timesPurchased * 10;
  }

}