import ZweihanderBaseItem from '../../documents/item/base-item';
import { rollTest } from '../../system/rolls/dice';
import { getItemRollConfiguration } from '../../system/rolls/test-config';

export default class ZweihanderDisease extends ZweihanderBaseItem {
  async roll(item) {
    const { skillItem, additionalConfiguration } = getItemRollConfiguration(item);

    await rollTest(skillItem, 'disease', additionalConfiguration, {
      showDialog: true,
    });
  }

  async _preCreate(item, options, user, that) {
    await super._preCreate(item, options, user);

    if (that.actor && item?.system?.duration?.value === 0 && !item?.system?.duration?.lastsUntilCured) {
      const formulaData = item.system.duration.formula;
      const number = formulaData.number;
      const die = formulaData.die;
      const bonus = formulaData.bonus;

      const roll = await new Roll(`${number}${die}+${bonus}`).evaluate();
      const speaker = ChatMessage.getSpeaker({ actor: that.actor });
      await roll.toMessage({ flavor: game.i18n.localize('ZWEI.othermessages.recuperationtime'), speaker });
      that.updateSource({ 'system.duration.value': roll.total });
    }
  }
}
