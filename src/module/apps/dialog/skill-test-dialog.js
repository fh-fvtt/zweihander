import { getDifficultyRatingLabel, selectedChoice } from '../../system/utils';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { expandObject } = foundry.utils;

export default class SkillTestDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ['zweihander', 'skill-test-config'],
    id: 'zweihander_skill_test_config',
    tag: 'form',
    form: {
      handler: SkillTestDialog.#onSubmit,
      closeOnSubmit: true,
    },
    window: {
      contentClasses: ['standard-form'],
      icon: 'fa-solid fa-dice-d20',
    },
    position: {
      width: 585,
      height: 'auto',
    },
  };

  static PARTS = {
    main: { template: 'systems/zweihander/src/templates/app/skill-test-dialog.hbs' },
    footer: { template: 'templates/generic/form-footer.hbs' },
  };

  constructor({ skill, testType, testConfigurationOptions, resolve, reject, ...options }) {
    super(options);

    this._skill = skill;
    this._testType = testType;
    this._testConfigurationOptions = testConfigurationOptions;
    this._resolve = resolve;
  }

  // ---=== GETTERS ===---

  get title() {
    return `${_loc('ZWEI.rolls.testconfig')}: ${this._skill.name}`;
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const actor = this._skill.actor;
    const configOptions = this._testConfigurationOptions;

    context.testType = this._testType;
    context.skillEffects = actor.getSkillEffects(this._skill, this._testType);

    context.fortuneOptions = [
      { value: 'dontuse', label: _loc('ZWEI.rolls.dontuse') },
      { value: 'fortune', label: _loc('ZWEI.rolls.fortune') },
      { value: 'misfortune', label: _loc('ZWEI.rolls.misfortune') },
    ].map((option) => ({
      selected: (configOptions.useFortune ?? 'dontuse') === option.value ? 'selected' : '',
      ...option,
    }));

    context.difficultyRatings = [...Array(7).keys()].map((i) => {
      const value = i * 10 - 30;
      const selected = (configOptions.difficultyRating ?? 0) === value ? 'selected' : '';
      return { value, label: getDifficultyRatingLabel(value), selected };
    });

    context.flipOptions = [
      { value: 'noflip', label: _loc('ZWEI.rolls.noflip') },
      { value: 'flipfail', label: _loc('ZWEI.rolls.flipfail') },
      { value: 'flipsucceed', label: _loc('ZWEI.rolls.flipsucceed') },
    ].map((option) => ({
      selected: (configOptions.flip ?? 'noflip') === option.value ? 'selected' : '',
      ...option,
    }));

    context.skillModes = selectedChoice(
      configOptions.testMode ?? 'standard',
      Object.entries(CONFIG.ZWEI.testModes).map(([value, { label, help }]) => ({
        value,
        label: `${label} ${help ? `(${help})` : ''}`,
      }))
    );

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);

    if (partId == 'footer') {
      partContext.buttons = [
        {
          type: 'submit',
          label: _loc('ZWEI.rolls.roll'),
        },
      ];
    }
    return partContext;
  }

  /** @override */
  _onClose(options) {
    this._resolve?.({ cancelled: true });
    super._onClose(options);
  }

  // ---=== HELPER METHODS ===---

  static #applyEffectBonuses(baseChance, elements) {
    const checked = Array.from(elements)
      .filter((el) => el.type === 'checkbox' && el.checked)
      .map((el) => ({ value: Number(el.dataset.modifierValue), mode: el.dataset.modifierType }));

    let result = baseChance;

    result += checked.filter((c) => c.mode === 'add').reduce((sum, c) => sum + c.value, 0);
    result -= checked.filter((c) => c.mode === 'subtract').reduce((sum, c) => sum + c.value, 0);
    for (const c of checked.filter((c) => c.mode === 'multiply')) result *= c.value;
    for (const c of checked.filter((c) => c.mode === 'downgrade')) result = Math.min(result, c.value);
    for (const c of checked.filter((c) => c.mode === 'upgrade')) result = Math.max(result, c.value);
    for (const c of checked.filter((c) => c.mode === 'override')) result = c.value;

    return result;
  }

  _collectResolveData(expandedFormData) {
    // nothing to add by default
    return {};
  }

  // ---=== SUBMIT HANDLER ===---

  /**
   * @this SkillTestDialog
   */
  static async #onSubmit(event, form, formData) {
    const expandedFormData = expandObject(formData.object);

    const difficultyRating = Number(expandedFormData.difficultyRatingSelect);
    const flip = expandedFormData.flipSelect;

    const baseChanceModifier = SkillTestDialog.#applyEffectBonuses(
      Number(expandedFormData.baseChanceModifier),
      form.elements
    );

    const testMode = expandedFormData.skillMode;

    this._resolve({
      difficultyRating,
      flip,
      baseChanceModifier,
      testMode,
      ...this._collectResolveData(expandedFormData),
    });
  }
}
