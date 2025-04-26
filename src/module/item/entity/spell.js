import ZweihanderBaseItem from './base-item';
import { rollTest } from '../../dice';
import { getItemRollConfiguration } from '../../apps/test-config';

export default class ZweihanderSpell extends ZweihanderBaseItem {
  prepareDerivedData(item) {
    let durationFormula = '';

    if (item.system.duration.formula.override) {
      const governingDurationAttribute =
        typeof item.system.duration?.base !== 'undefined' ? item.system.duration.base : '[WB]'; // @todo: localize

      durationFormula = `${governingDurationAttribute} + ${item.system.duration.bonus} ${item.system.duration.unit}`;
    } else {
      durationFormula = game.i18n.localize(`ZWEI.actor.items.durationList.${item.system.duration.value}`);
    }

    // @todo: remove in future version, this IF is here just to avoid errors when migrating from 5.4.1 -> 5.5.x
    if (item.system.duration?.value !== undefined) item.system.duration.label = durationFormula;
  }

  async _preUpdate(changed, options, user, item) {
    await super._preUpdate(changed, options, user, item);
  }

  async roll(item) {
    const { skillItem, additionalConfiguration } = getItemRollConfiguration(item);

    await rollTest(skillItem, 'spell', additionalConfiguration, {
      showDialog: true,
    });
  }
}
