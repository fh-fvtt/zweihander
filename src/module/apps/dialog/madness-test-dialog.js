import SkillTestDialog from './skill-test-dialog';

export default class MadnessTestDialog extends SkillTestDialog {
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.madnessOptions = [
      { value: 'stress', label: _loc('ZWEI.actor.secondary.stress') },
      { value: 'fear', label: _loc('ZWEI.actor.secondary.fear') },
      { value: 'terror', label: _loc('ZWEI.actor.secondary.terror') },
    ];

    return context;
  }

  /** @override */
  _collectResolveData(expandedFormData) {
    return {
      madnessType: expandedFormData.madnessSelect,
    };
  }
}
