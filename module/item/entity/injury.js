import ZweihanderBaseItem from "./base-item";

export default class ZweihanderInjury extends ZweihanderBaseItem {

  async _preCreate(data, options, user, that) {
    await super._preCreate(data, options, user);

    if (that.actor && data?.data?.recuperationTime === 0) {
      const d = Number(data.data.severity) + 1;
      const roll = await (new Roll(`${d}d10+${d}`)).evaluate();
      const speaker = ChatMessage.getSpeaker({actor: that.actor});
      roll.toMessage({flavor: 'Determining Recuperation Time', speaker});
      that.data.update({'data.recuperationTime': roll.total});
    }
  }

}