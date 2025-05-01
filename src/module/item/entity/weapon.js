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

    const currentlyActiveEffects = item.effects.filter((e) => e.system.isActive);

    // If Item is unequipped, disable all currently active Active Effects associated with it
    if (!changed.system.carried && currentlyActiveEffects.length) {
      for (let effect of currentlyActiveEffects) await effect.update({ ['system.isActive']: false });
    }

    await super._preUpdate(changed, options, user, item);
  }

  prepareDerivedData(item) {
    item.system.equipped = item.system.equipped && item.system.carried;

    let distanceFormula = '';

    if (item.system.ranged.value) {
      const governingDistanceAttribute =
        typeof item.system.distance?.base !== 'undefined' ? item.system.distance.base : '[PB]'; // @todo: localize

      distanceFormula = `${governingDistanceAttribute} + ${item.system.distance.bonus} ` + game.i18n.localize("ZWEI.actor.details.labels.yardabbr");
    } else {
      distanceFormula = game.i18n.localize("ZWEI.actor.items.engaged") + `${item.system.distance.bonus ? ' ' + game.i18n.localize("ZWEI.actor.items.or") + ' ' + item.system.distance.bonus + ' ' + game.i18n.localize("ZWEI.actor.details.labels.yardabbr") : ''}`;
    }

    // @todo: remove in future version, this IF is here just to avoid errors when migrating from 5.4.1 -> 5.5.x
    if (item.system.distance?.value !== undefined) item.system.distance.value = distanceFormula;
  }

  async roll(item) {
    const { skillItem, additionalConfiguration } = getItemRollConfiguration(item);

    await rollTest(skillItem, 'weapon', additionalConfiguration, {
      showDialog: true,
    });
  }
}
