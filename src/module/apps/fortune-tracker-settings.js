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
      { value: 'compact', label: "compact" },
      { value: 'normal', label: "normal" },
      { value: 'big', label: "big" },
      { value: 'huge', label: "huge" },
    ].map((option) => ({
      selected: (fortuneTrackerData.size ?? 'normal') === option.value ? 'selected' : '',
      ...option,
    }));
    fortuneTrackerData.choices.notifications = [
      { value: 'none', label: "dontalert" },
      { value: 'notify', label: "postnotifications" },
      { value: 'chat', label: "postmessages" },
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
