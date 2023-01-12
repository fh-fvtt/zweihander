export default class FortuneTrackerSettings extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/zweihander/src/templates/app/fortune-tracker-settings.hbs',
      popOut: true,
      minimizable: true,
      resizable: false,
      title: "ZWEI.settings.fortunetracker",
      id: 'fortuneTrackerSettings',
      classes: ['zweihander'],
      width: 600,
      height: 275,
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false,
    });
  }

  getData() {
    const fortuneTrackerData = game.settings.get('zweihander', 'fortuneTrackerSettings');
    fortuneTrackerData.choices = {};
    fortuneTrackerData.choices.size = [
      { value: 'compact', label: game.i18n.localize("ZWEI.settings.ftsettings.compact") },
      { value: 'normal', label: game.i18n.localize("ZWEI.settings.ftsettings.normal") },
      { value: 'big', label: game.i18n.localize("ZWEI.settings.ftsettings.big") },
      { value: 'huge', label: game.i18n.localize("ZWEI.settings.ftsettings.huge") },
    ].map((option) => ({
      selected: (fortuneTrackerData.size ?? 'normal') === option.value ? 'selected' : '',
      ...option,
    }));
    fortuneTrackerData.choices.notifications = [
      { value: 'none', label: game.i18n.localize("ZWEI.settings.ftsettings.dontalert") },
      { value: 'notify', label: game.i18n.localize("ZWEI.settings.ftsettings.postnotifications") },
      { value: 'chat', label: game.i18n.localize("ZWEI.settings.ftsettings.postmessages") },
    ].map((option) => ({
      selected: (fortuneTrackerData.notifications ?? 'notify') === option.value ? 'selected' : '',
      ...option,
    }));
    return fortuneTrackerData;
  }

  _updateObject(event, formData) {
    const data = expandObject(formData);
    game.settings.set('zweihander', 'fortuneTrackerSettings', data);
  }
}
