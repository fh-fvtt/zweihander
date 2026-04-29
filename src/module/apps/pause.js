const { GamePause } = foundry.applications.ui;

export default class ZweihanderGamePause extends GamePause {
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.icon = '../../../systems/zweihander/assets/hexagram.png';

    if (game.settings.get('zweihander', 'immersivePause')) {
      const doomingIndex = Math.floor(Math.random() * 200);
      context.text = game.i18n.localize(`ZWEI.pauseDoomings.${doomingIndex}`);
    }

    return context;
  }
}
