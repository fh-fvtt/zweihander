import SkillTestDialog from './skill-test-dialog';

export default class WeaponTestDialog extends SkillTestDialog {
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const configOptions = this._testConfigurationOptions;

    context.additionalFuryDice = configOptions.additionalFuryDice;

    return context;
  }

  /** @override */
  _collectResolveData(expandedFormData) {
    return {
      additionalFuryDice: Number(expandedFormData.extraFury) || 0,
    };
  }
}
