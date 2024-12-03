import * as ZweihanderUtils from '../utils';

export default class ZweihanderActiveEffectConfig extends ActiveEffectConfig {
  static get defaultOptions() {
    const classes = ['zweihander', 'sheet', 'active-effect-sheet'];

    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/zweihander/src/templates/app/active-effect-config.hbs',
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false,
      width: 585,
      classes,
    });
  }

  /**@override */
  async getData() {
    const data = await super.getData();

    data.selectableKeys = {
      pa: {},
      pab: {},
      sa: {},
    };

    for (let pa of CONFIG.ZWEI.primaryAttributes) {
      data.selectableKeys.pa[`system.stats.primaryAttributes.${pa}.value`] = game.i18n.localize('ZWEI.actor.primary.' + pa);
      data.selectableKeys.pab[`system.stats.primaryAttributes.${pa}.bonus`] = game.i18n.localize('ZWEI.actor.primarybonuses.' + pa);
    }

    for (let sa of CONFIG.ZWEI.secondaryAttributes) {
      data.selectableKeys.sa[`system.stats.secondaryAttributes.${sa}.value`] = game.i18n.localize('ZWEI.actor.secondary.' + sa
        .split(/(?=[A-Z])/)
        .map((w) => w.toLowerCase())
        .join(''));
    }

    return data;
  }

  async _render(force, options) {
    await super._render(force, options);
    this.element.css('height', 'auto');
    // this.element.css('top', 'calc(50% - 222px)'); // stop sheet from gluing to top
  }
}
