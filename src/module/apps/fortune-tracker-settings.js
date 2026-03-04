const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { SettingsConfig } = foundry.applications.settings;

export default class FortuneTrackerSettings extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    tag: 'form',
    id: 'fortuneTrackerSettings',
    classes: ['zweihander', 'sheet', 'settings-menu'],
    window: {
      minimizable: true,
      resizable: false,
      icon: 'ra ra-clover',
    },
    position: {
      width: 600,
      height: 'auto',
    },
    form: {
      handler: FortuneTrackerSettings.#onSubmit,
      submitOnChange: false,
    },
  };

  static PARTS = {
    main: { template: 'systems/zweihander/src/templates/app/fortune-tracker-settings.hbs' },
  };

  get title() {
    return game.i18n.localize('ZWEI.settings.fortunetracker');
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.fortuneTrackerData = game.settings.get('zweihander', 'fortuneTrackerSettings');
    context.fortuneTrackerData.choices = {};
    context.fortuneTrackerData.choices.size = [
      { value: 'compact', label: 'compact' },
      { value: 'normal', label: 'normal' },
      { value: 'big', label: 'big' },
      { value: 'huge', label: 'huge' },
    ].map((option) => ({
      selected: (context.fortuneTrackerData.size ?? 'normal') === option.value ? 'selected' : '',
      ...option,
    }));
    context.fortuneTrackerData.choices.notifications = [
      { value: 'none', label: 'dontalert' },
      { value: 'notify', label: 'postnotifications' },
      { value: 'chat', label: 'postmessages' },
    ].map((option) => ({
      selected: (context.fortuneTrackerData.notifications ?? 'notify') === option.value ? 'selected' : '',
      ...option,
    }));

    context.buttons = [{ type: 'submit', icon: 'fa-solid fa-floppy-disk', label: 'EFFECT.Submit' }];

    return context;
  }

  static async #onSubmit(event, form, formData) {
    const data = foundry.utils.expandObject(formData.object);

    await SettingsConfig.reloadConfirm({ world: true });

    game.settings.set('zweihander', 'fortuneTrackerSettings', data);
  }
}
