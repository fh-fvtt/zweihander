import { formDataToArray } from '../utils';

export default class CurrencySettings extends FormApplication {
  #currencies = [];

  constructor(...args) {
    super(...args);
    this.#currencies = game.settings.get('zweihander', 'currencySettings');
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/zweihander/src/templates/app/currency-settings.hbs',
      popOut: true,
      minimizable: false,
      resizable: false,
      title: "ZWEI.settings.currency",
      id: 'currency-settings',
      classes: ['zweihander'],
      width: 400,
      height: 'auto',
      submitOnChange: false,
      submitOnClose: false,
      closeOnSubmit: true,
    });
  }

  close() {
    super.close();
  }

  getData() {
    return this.#currencies;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.add-currency').click(async () => {
      this.#currencies.push({
        abbreviation: 'nc',
        name: 'New Currency',
        color: '#000000',
        equivalentOfLower: 1,
      });
      this.render();
    });
    html.find('.del-currency').click(async (event) => {
      const i = $(event.currentTarget).data('index');
      this.#currencies.splice(i, 1);
      this.render();
    });
  }

  async _updateObject(event, formData) {
    const c = formDataToArray(formData);
    await game.settings.set('zweihander', 'currencySettings', c);
    foundry.utils.debounce(() => window.location.reload(), 500)();
  }
}
