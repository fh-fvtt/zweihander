import ZweihanderBaseItem from './base-item';
import * as ZweihanderUtils from '../../utils';

import { rollTest } from '../../dice';
import { getItemRollConfiguration } from '../../apps/test-config';

export default class ZweihanderRitual extends ZweihanderBaseItem {
  prepareDerivedData(item) {
    let castingTimeFormula = '';

    if (item.system.castingTime.setting == 'formula') {
      castingTimeFormula = `${item.system.castingTime.number} ${item.system.castingTime.unit}`;
    } else {
      castingTimeFormula = game.i18n.localize(`ZWEI.actor.items.castingtimeList.${item.system.castingTime.setting}`);
    }

    // @todo: remove in future version, this IF is here just to avoid errors when migrating from 5.4.1 -> 5.5.x
    if (item.system.castingTime?.value !== undefined) item.system.castingTime.value = castingTimeFormula;

    if (!CONFIG.ZWEI.ritualDifficultyGeneric.includes(item.system.difficulty.rating))
      item.system.difficulty.value = `(${ZweihanderUtils.getDifficultyRatingLabel(item.system.difficulty.rating)}) ${
        item.system.difficulty.associatedSkill
      }`;
    else
      item.system.difficulty.value = game.i18n.localize(
        `ZWEI.actor.items.difficultyList.${item.system.difficulty.rating}`
      );
  }

  async _preUpdate(changed, options, user, item) {
    console.log(changed);

    await super._preUpdate(changed, options, user, item);
  }

  async roll(item) {
    const { skillItem, additionalConfiguration } = getItemRollConfiguration(item);

    await rollTest(skillItem, 'spell', additionalConfiguration, {
      showDialog: true,
    });
  }
}
