export default class FortuneTrackerSettings extends FormApplication {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/zweihander/templates/app/fortune-tracker-settings.hbs',
      popOut: true,
      minimizable: true,
      resizable: false,
      title: 'Fortune Tracker Settings',
      id: 'fortuneTrackerSettings',
      classes: ['zweihander'],
      width: 600,
      height: 275,
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  getData() {
    const data = game.settings.get('zweihander', 'fortuneTrackerSettings');
    data.choices = {};
    data.choices.size = [
      { value: "compact", label: "Compact (Text)" },
      { value: "normal", label: "Normal (Tokens)" },
      { value: "big", label: "Big (Tokens)" },
      { value: "huge", label: "Huge (Tokens)" }
    ].map(option => ({ selected: (data.size ?? 'normal') === option.value ? 'selected' : '', ...option }));
    data.choices.notifications = [
      { value: "none", label: "Don't Alert" },
      { value: "notify", label: "Post Foundry Notifications" },
      { value: "chat", label: "Post Chat Messages" },
    ].map(option => ({ selected: (data.notifications ?? 'notify') === option.value ? 'selected' : '', ...option }));
    return data;
  }

  _updateObject(event, formData) {
    const data = expandObject(formData);
    game.settings.set('zweihander', 'fortuneTrackerSettings', data);
  }
}