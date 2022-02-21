import ZweihanderBaseItem from "./base-item";
import * as ZweihanderUtils from "../../utils";

export default class ZweihanderSkill extends ZweihanderBaseItem {

  prepareBaseData(itemData, item) {
    if (!item.isOwned || !item?.actor?.data) return;
    const data = itemData.data;
    const actor = item.actor;
    data.rank = actor.items
      .filter(i => i.type === 'profession')
      .flatMap(p => p.data.data.skillRanks?.filter?.(sr => sr.value === item.name && sr.purchased))
      ?.length ?? 0;
    data.bonusPerRank = 10
    data.bonus = data.rank * data.bonusPerRank;
    data.isFlipToFail = data.requiresTraining && data.rank === 0
  }

}