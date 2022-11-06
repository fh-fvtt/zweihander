import { formDataToArray } from '../utils';

export default class ZweihanderLanguageConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/zweihander/src/templates/app/language-config.hbs',
      popOut: true,
      minimizable: false,
      resizable: false,
      classes: ['zweihander', 'language-config'],
      width: 400,
      height: 'auto',
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false,
    });
  }

  /** @override */
  get title() {
    return `${this.object.name}: Languages`;
  }

  /** @override */
  getData() {
    const data = { languages: this.object.system.languages };
    return data;
  }

  /** @override */
  async _updateObject(event, formData) {
    const languages = formDataToArray(formData, 'languages');
    await this.object.update({ 'system.languages': languages });
    this.render();
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.add-language').click(() => {
      const l = this.object.system.languages;
      l.push({ name: 'New Language', isLiterate: false });
      this.object.update({ 'system.languages': l });
      this.render();
    });
    html.find('.del-language').click((event) => {
      const l = this.object.system.languages;
      const i = $(event.currentTarget).data('index');
      l.splice(i, 1);
      this.object.update({ 'system.languages': l });
      this.render();
    });
  }
}
