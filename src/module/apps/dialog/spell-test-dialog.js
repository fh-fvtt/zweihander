import SkillTestDialog from './skill-test-dialog';

export default class SpellTestDialog extends SkillTestDialog {
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const configOptions = this._testConfigurationOptions;

    // @todo: refactor to use testType
    context.spellRoll = true;
    context.additionalChaosDice = configOptions.additionalChaosDice;

    context.channelPowerBonuses = [
      { value: 0, label: 'channel0' },
      { value: 10, label: 'channel1' },
      { value: 20, label: 'channel2' },
      { value: 30, label: 'channel3' },
    ].map((option) => ({
      selected: (configOptions.channelPowerBonus ?? '0') === option.value ? 'selected' : '',
      ...option,
    }));

    return context;
  }

  /** @override */
  _collectResolveData(expandedFormData) {
    return {
      additionalChaosDice: Number(expandedFormData.extraChaos) || 0,
      channelPowerBonus: Number(expandedFormData.channelSelect),
    };
  }
}
