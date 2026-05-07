import { formDataToArray } from '../system/utils';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { SettingsConfig } = foundry.applications.settings;

export default class CurrencySettings extends HandlebarsApplicationMixin(ApplicationV2) {
  #currencies = [];

  constructor(...args) {
    super(...args);
    this.#currencies = game.settings.get('zweihander', 'currencySettings');
  }

  static DEFAULT_OPTIONS = {
    tag: 'form',
    id: 'currency-settings',
    classes: ['zweihander', 'sheet', 'settings-menu'],
    window: {
      minimizable: false,
      resizable: false,
      icon: 'fa-solid fa-piggy-bank',
    },
    position: {
      width: 600,
      height: 'auto',
    },
    form: {
      handler: CurrencySettings.#onSubmit,
      submitOnChange: false,
    },
    actions: {
      addCurrency: CurrencySettings.#addCurrency,
      deleteCurrency: CurrencySettings.#deleteCurrency,
    },
  };

  static PARTS = {
    main: { template: 'systems/zweihander/src/templates/app/currency-settings.hbs' },
  };

  get title() {
    return game.i18n.localize('ZWEI.settings.currency');
  }

  close() {
    super.close();
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.buttons = [{ type: 'submit', icon: 'fa-solid fa-floppy-disk', label: 'EFFECT.Submit' }];
    context.currencies = this.#currencies;

    return context;
  }

  /**
   * @this CurrencySettings
   */
  static async #addCurrency() {
    this.#currencies.push({
      abbreviation: game.i18n.localize('ZWEI.coinage.nc'),
      name: game.i18n.localize('ZWEI.coinage.newcurrency'),
      color: '#000000',
      equivalentOfLower: 1,
    });

    await this.render();
  }

  /**
   * @this CurrencySettings
   */
  static async #deleteCurrency(event, target) {
    const i = target.dataset['index'];
    this.#currencies.splice(i, 1);
    await this.render();
  }

  static async #onSubmit(event, form, formData) {
    const c = formDataToArray(formData.object);

    await SettingsConfig.reloadConfirm({ world: true });

    game.settings.set('zweihander', 'currencySettings', c);
  }
}
