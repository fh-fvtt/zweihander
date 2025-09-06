export default class ZweihanderActiveEffect extends ActiveEffect {
  prepareBaseData() {}

  apply(actor, change) {
    if (!this.system.isActive) return null;

    return super.apply(actor, change);
  }

  async _preUpdate(changed, options, user) {
    const parent = this.parent;

    if (parent.documentName === 'Item' && ['weapon', 'trapping', 'armor'].includes(parent.type)) {
      const carried = parent.system.carried;

      if (changed?.system?.['isActive'] !== undefined && !carried) {
        changed.system.isActive = false;
        ui.notifications.warn(game.i18n.format('ZWEI.othermessages.cannotenableae', { item: parent.name }));
      }
    }

    await super._preUpdate(changed, options, user);
  }
}
