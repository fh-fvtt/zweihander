const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { getProperty } = foundry.utils;

export default class ZweihanderActorConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
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
    const configOptions = actor.system.settings;

    context.actorType = actor.type;
    context.globalModifiers = [];

    if (!actor.isVehicle) {
      context.globalModifiers.push({
        label: _loc('ZWEI.settings.acsettings.globalinitiativeoverride'),
        nameAttr: 'initiativeOverride',
        valueAttr: configOptions.initiativeOverride,
        hint: _loc('ZWEI.settings.acsettings.globalinitiativeoverridehint'),
      });

      context.globalModifiers.unshift({
        label: _loc('ZWEI.settings.acsettings.globalapmodifier'),
        nameAttr: 'apModifier',
        valueAttr: configOptions.apModifier,
        hint: _loc('ZWEI.settings.acsettings.globalapmodifierhint'),
      });

      context.filePaths = {
        dodgeSound: configOptions.dodgeSound,
        parrySound: configOptions.parrySound,
        gruntSound: configOptions.gruntSound,
      };

      context.playGruntSound = configOptions.playGruntSound;
    }

    if (actor.isCharacter) {
      context.filePaths.headerBackground = configOptions.headerBackground;

      const skillPack = game.packs.get(game.settings.get('zweihander', 'skillPack'));
      const skills = (await skillPack.getIndex()).map((s) => s.name).sort((a, b) => a.localeCompare(b));

      ['parry', 'dodge', 'magick', 'peril'].forEach((key) => {
        context[`${key}Skills`] = skills.map((s) => ({
          value: s,
          label: s,
          selected: configOptions[`${key}Skills`].includes(s),
        }));
      });

      context.avoidAllPeril = configOptions.isIgnoredPerilLadderValue.reduce((a, b) => a && b, true);

      context.governingAttributes = ['dth', 'pth', 'int', 'mov'].map((attr) => ({
        label: _loc(`ZWEI.settings.acsettings.primary${attr}`),
        nameAttr: `${attr}Attribute`,
        hint: _loc(`ZWEI.settings.acsettings.primary${attr}hint`),
        attributes: CONFIG.ZWEI.primaryAttributes.map((pa) => ({
          value: pa,
          label: _loc(`ZWEI.actor.primary.${pa}`),
          selected: pa === configOptions[`${attr}Attribute`] ? 'selected' : '',
        })),
      }));

      ['initiative', 'movement', 'encumbrance'].forEach((mod) =>
        context.globalModifiers.unshift({
          label: _loc(`ZWEI.settings.acsettings.global${mod}`),
          nameAttr: `${mod}Modifier`,
          valueAttr: configOptions[`${mod}Modifier`],
          hint: _loc(`ZWEI.settings.acsettings.global${mod}hint`),
        })
      );

      context.isIgnoredPerilLadderValue = configOptions.isIgnoredPerilLadderValue;

      context.permanentRanks = {
        chaos: configOptions.permanentChaosRanks,
        order: configOptions.permanentOrderRanks,
      };

      context.isMagickUser = configOptions.isMagickUser;
    }

    return context;
  }

  get title() {
    return `Actor Configuration: ${this.options.document.name}`;
  }

  static async #onSubmit(event, form, formData) {
    const actor = this.options.document;
    const configOptions = actor.system.settings;

    const expandedFormData = foundry.utils.expandObject(formData.object);
    const actorUpdate = {};

    if (actor.type === 'character') {
      const sa = actor.system.stats.secondaryAttributes;
      const saPath = 'system.stats.secondaryAttributes';

      ['parry', 'dodge', 'magick', 'peril'].forEach((key) => {
        const actorDataKey = key === 'peril' ? 'madness' : key;
        if (!expandedFormData[`${key}Skills`].includes(sa[actorDataKey].associatedSkill)) {
          actorUpdate[[`${saPath}.${actorDataKey}.associatedSkill`]] = expandedFormData[`${key}Skills`][0] ?? '';
        }
      });

      // wtf is this template system haha
      expandedFormData.isIgnoredPerilLadderValue = [
        expandedFormData.isIgnoredPerilLadderValue['[0]'],
        expandedFormData.isIgnoredPerilLadderValue['[1]'],
        expandedFormData.isIgnoredPerilLadderValue['[2]'],
      ];

      const avoidAllUpdate = expandedFormData.avoidAllPeril;
      const avoidAllBefore = configOptions.isIgnoredPerilLadderValue.reduce((a, b) => a && b, true);

      if (avoidAllUpdate && !avoidAllBefore) {
        expandedFormData.isIgnoredPerilLadderValue = [true, true, true];
      } else if (!avoidAllUpdate && avoidAllBefore) {
        expandedFormData.isIgnoredPerilLadderValue = [false, false, false];
      }

      delete expandedFormData.avoidAllPeril;
    }

    const updateData = Object.fromEntries(
      Object.entries(expandedFormData).map(([key, value]) => [`system.settings.${key}`, value])
    );

    if (Object.keys(actorUpdate).length) {
      Object.assign(updateData, actorUpdate);
    }

    await actor.update(updateData);

    this.render();
  }
}
