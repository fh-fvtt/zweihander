import ZweihanderBaseItem from './base-item';
import { rollTest } from '../../dice';
import { getItemRollConfiguration } from '../../apps/test-config';

export default class ZweihanderWeapon extends ZweihanderBaseItem {
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

  async roll(item) {
    const { skillItem, additionalConfiguration } = getItemRollConfiguration(item);

    await rollTest(skillItem, 'weapon', additionalConfiguration, {
      showDialog: true,
    });
  }
}
