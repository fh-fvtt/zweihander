import MadnessTestDialog from './madness-test-dialog';
import SkillTestDialog from './skill-test-dialog';
import SpellTestDialog from './spell-test-dialog';
import WeaponTestDialog from './weapon-test-dialog';

export default class ZweihanderTestDialogFactory {
  static #dialogTypes = {
    weapon: WeaponTestDialog,
    spell: SpellTestDialog,
    madness: MadnessTestDialog,
  };

  static create(skill, testType = 'skill', testConfigurationOptions = {}) {
    const TestDialog = this.#dialogTypes[testType] ?? SkillTestDialog;
    const { promise, resolve } = Promise.withResolvers();
    const dialog = new TestDialog({ skill, testType, testConfigurationOptions, resolve });

    // ...listeners here (prerender, render, close, position)...

    dialog.render({ force: true });
    return promise;
  }
}
