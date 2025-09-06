const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ZweihanderActorConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ['zweihander', 'sheet', 'actor-config'],
    id: 'zweihander_actor_config',
    tag: 'form',
    form: {
      handler: ZweihanderActorConfig.#onSubmit,
      submitOnChange: true,
      submitOnClose: true,
    },
    window: {
      contentClasses: ['sheet-body'],
      icon: 'fa-solid fa-user-gear',
    },
    position: {
      width: 585,
      height: 'auto',
    },
  };

  static PARTS = {
    main: { template: 'systems/zweihander/src/templates/app/actor-config.hbs' },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const actor = this.options.document;

    context.actorType = actor.type;
    context.flags = ZweihanderActorConfig.getConfig(actor);
    context.parrySkills = context.flags.parrySkills.join(', ');
    context.dodgeSkills = context.flags.dodgeSkills.join(', ');
    context.magickSkills = context.flags.magickSkills.join(', ');
    context.avoidAllPeril = context.flags.isIgnoredPerilLadderValue.reduce((a, b) => a && b, true);

    const attributeNames = ['dth', 'pth', 'int', 'mov'];

    context.governingAttributes = attributeNames.map((attr) => ({
      label: game.i18n.localize(`ZWEI.settings.acsettings.primary${attr}`),
      nameAttr: `flags.${attr}Attribute`,
      hint: game.i18n.localize(`ZWEI.settings.acsettings.primary${attr}hint`),
      attributes: CONFIG.ZWEI.primaryAttributes.map((pa) => ({
        value: pa,
        label: game.i18n.localize(`ZWEI.actor.primary.${pa}`),
        selected: pa === context.flags[`${attr}Attribute`] ? 'selected' : '',
      })),
    }));

    const modifierNames = ['encumbrance', 'initiative', 'movement'];

    context.globalModifiers = modifierNames.map((mod) => ({
      label: game.i18n.localize(`ZWEI.settings.acsettings.global${mod}`),
      nameAttr: `flags.${mod}Modifier`,
      valueAttr: context.flags[`${mod}Modifier`],
    }));

    return context;
  }

  static getDefaultConfiguration = (key) => {
    const getDefaultSkills = (packName) =>
      game.settings
        .get('zweihander', packName)
        .split(',')
        .map((s) => s.trim());

    const defaultConfiguration = {
      dthAttribute: 'brawn',
      pthAttribute: 'willpower',
      intAttribute: 'perception',
      movAttribute: 'agility',
      isIgnoredPerilLadderValue: [false, false, false],
      encumbranceModifier: 0,
      initiativeModifier: 0,
      movementModifier: 0,
      parrySkills: getDefaultSkills('defaultParrySkills'),
      dodgeSkills: getDefaultSkills('defaultDodgeSkills'),
      magickSkills: getDefaultSkills('defaultMagickSkills'),
      isMagickUser: false,
      permanentChaosRanks: 0,
      permanentOrderRanks: 0,
      headerBackground: 'systems/zweihander/assets/default-header-bg.webp',
      dodgeSound: 'systems/zweihander/assets/sounds/dodge.mp3',
      parrySound: 'systems/zweihander/assets/sounds/parry.mp3',
      gruntSound: 'systems/zweihander/assets/sounds/grunt_m.mp3',
      playGruntSound: true,
    };

    return key ? defaultConfiguration[key] : defaultConfiguration;
  };

  static getValue(actorData, key) {
    const value = getProperty(actorData.flags, `zweihander.actorConfig.${key}`);
    return value ?? this.getDefaultConfiguration(key);
  }

  static getConfig(actorData) {
    const cfg = {};
    const defaultConfiguration = this.getDefaultConfiguration();

    for (let key in defaultConfiguration) {
      cfg[key] = this.getValue(actorData, key);
    }
    return cfg;
  }

  static async #onSubmit(event, form, formData) {
    const actor = this.options.document;

    const updateData = foundry.utils.expandObject(formData.object).flags;

    if (actor.type === 'character') {
      const sa = actor.system.stats.secondaryAttributes;
      const saPath = 'system.stats.secondaryAttributes';
      const actorUpdate = {};

      updateData.parrySkills = updateData.parrySkills.split(',').map((skill) => skill.trim());

      if (!updateData.parrySkills.includes(sa.parry.associatedSkill)) {
        actorUpdate[`${saPath}.parry.associatedSkill`] = updateData.parrySkills[0] ?? '';
      }

      updateData.dodgeSkills = updateData.dodgeSkills.split(',').map((skill) => skill.trim());

      if (!updateData.dodgeSkills.includes(sa.dodge.associatedSkill)) {
        actorUpdate[`${saPath}.dodge.associatedSkill`] = updateData.dodgeSkills[0] ?? '';
      }

      updateData.magickSkills = updateData.magickSkills.split(',').map((skill) => skill.trim());

      if (!updateData.magickSkills.includes(sa.magick.associatedSkill)) {
        actorUpdate[`${saPath}.magick.associatedSkill`] = updateData.magickSkills[0] ?? '';
      }

      // wtf is this template system haha
      updateData.isIgnoredPerilLadderValue = [
        updateData.isIgnoredPerilLadderValue['[0]'],
        updateData.isIgnoredPerilLadderValue['[1]'],
        updateData.isIgnoredPerilLadderValue['[2]'],
      ];

      const avoidAllUpdate = foundry.utils.expandObject(formData.object).avoidAllPeril;
      const avoidAllBefore = ZweihanderActorConfig.getConfig(actor).isIgnoredPerilLadderValue.reduce(
        (a, b) => a && b,
        true
      );

      if (avoidAllUpdate && !avoidAllBefore) {
        updateData.isIgnoredPerilLadderValue = [true, true, true];
      } else if (!avoidAllUpdate && avoidAllBefore) {
        updateData.isIgnoredPerilLadderValue = [false, false, false];
      }

      if (Object.keys(actorUpdate).length) {
        await actor.update(actorUpdate);
      }
    }

    await actor.setFlag('zweihander', 'actorConfig', updateData);

    this.render();
  }

  get title() {
    return `Actor Configuration: ${this.options.document.name}`;
  }
}
