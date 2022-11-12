import ZweihanderBaseItem from './base-item';
import * as ZweihanderUtils from '../../utils';

export default class ZweihanderSkill extends ZweihanderBaseItem {
  prepareBaseData(item) {
    if (!item.isOwned || !item?.actor?.system) return;
    const actor = item.actor;
    if (actor.type === 'character') {
      item.system.rank =
        actor.items
          .filter((i) => i.type === 'profession')
          .flatMap((p) => p.system.skillRanks?.filter?.((sr) => sr.name === item.name && sr.purchased))?.length ?? 0;
    } else {
      item.system.rank = actor.system.skillRanks?.[item.name] ?? 0;
    }
    item.system.bonusPerRank = 10;
    item.system.bonus = item.system.rank * item.system.bonusPerRank;
    item.system.isFlipToFail = item.system.requiresTraining && item.system.rank === 0;
  }
}
