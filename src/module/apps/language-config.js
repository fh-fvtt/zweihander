import { formDataToArray } from '../utils';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ZweihanderLanguageConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ['zweihander', 'language-config'],
    tag: 'form',
    form: {
      handler: ZweihanderLanguageConfig.#onSubmit,
      submitOnChange: true,
      submitOnClose: true,
    },
    window: {
      icon: 'fa-solid fa-feather-pointed',
      contentClasses: ['languages-container'],
    },
    position: {
      width: 500,
    },
    actions: {
      addLanguage: ZweihanderLanguageConfig.#addLanguage,
      deleteLanguage: ZweihanderLanguageConfig.#deleteLanguage,
    },
  };

  static PARTS = {
    header: { template: 'systems/zweihander/src/templates/app/language-config/header.hbs' },
    list: { template: 'systems/zweihander/src/templates/app/language-config/list.hbs' },
  };

  static async #onSubmit(event, form, formData) {
    const actor = this.options.document;
    const languages = formDataToArray(formData.object, 'languages');
    await actor.update({ 'system.languages': languages });
    await this.render();
  }

  static async #addLanguage() {
    const actor = this.options.document;
    const l = actor.system.languages;
    l.push({ name: 'New Language', isLiterate: false });
    await actor.update({ 'system.languages': l });
    await this.render();
  }

  static async #deleteLanguage(event, target) {
    const actor = this.options.document;
    const l = actor.system.languages;
    const i = target.dataset['index'];
    l.splice(i, 1);
    await actor.update({ 'system.languages': l });
    await this.render();
  }

  async _prepareContext(options) {
    const actor = this.options.document;
    const context = { languages: actor.system.languages };
    return context;
  }

  get title() {
    return `Language Configuration: ${this.options.document.name}`;
  }
}
