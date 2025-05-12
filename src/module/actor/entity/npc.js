import ZweihanderCreature from './creature';
import * as ZweihanderUtils from '../../utils';

export default class ZweihanderNPC extends ZweihanderCreature {
  prepareDerivedData(actor) {
    super.prepareDerivedData(actor);

    const systemData = actor.system;
    const sa = systemData.stats.secondaryAttributes;

    if (!actor.system.stats.manualMode) {
      const equippedArmor = actor.items.filter((a) => a.type === 'armor');

      const maxEquippedArmor =
        equippedArmor?.[ZweihanderUtils.argMax(equippedArmor.map((a) => a.system.damageThresholdModifier))];

      const damageModifier = maxEquippedArmor?.system?.damageThresholdModifier ?? 0;

      sa.damageThreshold.value = systemData.stats.primaryAttributes.brawn.bonus + damageModifier;
      sa.damageThreshold.baseValue = systemData.stats.primaryAttributes.brawn.bonus;
      sa.damageThreshold.dtm = damageModifier;
    }
  }
}
