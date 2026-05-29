export default class ZweihanderActiveEffect extends ActiveEffect {
  /** @override */
  prepareBaseData() {}

  /** @override */
  static _applyChangeUnguided(targetDoc, change, changes, options = {}) {
    if (!change.key || !change.key.startsWith?.('flags.')) return;
    super._applyChangeUnguided(targetDoc, change, changes, options);
  }

  /** @override */
  async _preUpdate(changed, options, user) {
    const parent = this.parent;

    if (!parent) return;

    if (parent.documentName === 'Item' && ['weapon', 'trapping', 'armor'].includes(parent.type)) {
      const carried = parent.system.carried;

      if (changed?.disabled !== undefined && !carried) {
        changed.disabled = true;
        ui.notifications.warn(game.i18n.format('ZWEI.othermessages.cannotenableae', { item: parent.name }));
      }
    }

    await super._preUpdate(changed, options, user);
  }
}
