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
      { value: 'compact', label: 'Compact (Text)' },
      { value: 'normal', label: 'Normal (Tokens)' },
      { value: 'big', label: 'Big (Tokens)' },
      { value: 'huge', label: 'Huge (Tokens)' },
    ].map((option) => ({
      selected: (fortuneTrackerData.size ?? 'normal') === option.value ? 'selected' : '',
      ...option,
    }));
    fortuneTrackerData.choices.notifications = [
      { value: 'none', label: "Don't Alert" },
      { value: 'notify', label: 'Post Foundry Notifications' },
      { value: 'chat', label: 'Post Chat Messages' },
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
