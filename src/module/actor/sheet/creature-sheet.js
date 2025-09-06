import ZweihanderBaseActorSheet from './base-actor-sheet';
import { selectedChoice } from '../../utils';

export default class ZweihanderCreatureSheet extends ZweihanderBaseActorSheet {
  static unsupportedItemTypes = new Set([
    'ancestry',
    'profession',
    'quality',
    'skill',
    'uniqueAdvance',
    'talent',
    'armor',
    'ritual',
    'disorder',
    'disease',
  ]);

  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ['creature'],
    window: {
      icon: 'fa-solid fa-bugs',
    },
  };

  static PARTS = {
    header: { template: 'systems/zweihander/src/templates/creature/header.hbs' },
    details: { template: 'systems/zweihander/src/templates/partials/details-list-npc.hbs' },
    main: {
      template: 'systems/zweihander/src/templates/creature/main.hbs',
      scrollable: ['', '.weapons-list', '.skills', '.stacked-list', '.loot-list', '.description'],
    },
  };

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);

    const compactMode = game.settings.get('zweihander', 'openInCompactMode');

    initialized.position.width = compactMode ? 540 : 625;
    initialized.position.height = compactMode ? 560 : 705;

    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const actor = context.document;

    context.choices = {};

    const size = actor.system.details.size ?? 1;
    context.choices.sizes = selectedChoice(size, [
      { value: 0, label: 'small' },
      { value: 1, label: 'normal' },
      { value: 2, label: 'large' },
      { value: 3, label: 'huge' },
    ]);

    const rf = actor.system.details.riskFactor?.value ?? 0;
    context.choices.riskFactors = selectedChoice(rf, [
      { value: 0, label: 'basic' },
      { value: 1, label: 'intermediate' },
      { value: 2, label: 'advanced' },
      { value: 3, label: 'elite' },
    ]);

    const notch = actor.system.details.riskFactor?.notch ?? 1;
    context.choices.notches = selectedChoice(notch, [
      { value: 0, label: 'low' },
      { value: 1, label: 'medium' },
      { value: 2, label: 'high' },
      { value: 3, label: 'unique' },
    ]);

    const hidden = this.actor.limited;

    context.details = [
      {
        choices: context.choices,
        template: 'partials/detail-risk-factor',
        hidden,
      },
      {
        key: 'details.size',
        choices: context.choices.sizes,
      },
      {
        key: 'details.classification',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.classification'),
        hidden,
      },
      {
        key: 'details.role',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.role'),
        hidden,
      },
      {
        key: 'details.influences',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.influences'),
        hidden,
      },
      {
        value: actor.system.languages,
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.languages'),
        template: 'partials/detail-languages',
        hidden,
      },
    ];

    const $$ = (x) => context.itemGroups[x];
    context.itemLists = {
      attackProfiles: ['weapons'].map($$),
      loot: ['trappings'].map($$),
      rules: ['traits', 'spells', 'taints', 'conditions', 'injuries'].map($$),
    };

    return context;
  }

  async _prepareItems(context) {
    await super._prepareItems(context);
    // set up collections for all item types
    const indexedTypes = [
      'trapping',
      'condition',
      'injury',
      'disease',
      'disorder',
      'profession',
      'ancestry',
      'armor',
      'weapon',
      'spell',
      'ritual',
      'talent',
      'trait',
      'drawback',
      'quality',
      'skill',
      'uniqueAdvance',
      'taint',
    ].filter((t) => t === 'skill' || !this.constructor.unsupportedItemTypes.has(t));

    const pluralize = (t) =>
      ({
        injury: 'injuries',
        ancestry: 'ancestry',
        armor: 'armor',
        quality: 'qualities',
      }[t] ?? t + 's');

    indexedTypes.forEach((t) => (context[pluralize(t)] = []));

    context.items
      .filter((i) => indexedTypes.includes(i.type))
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .forEach((i) => context[pluralize(i.type)].push(i));

    // sort skills alphabetically
    context.skills = context.skills.sort((a, b) => {
      const aloc = a.name;
      const bloc = b.name;
      return aloc.localeCompare(bloc);
    });

    // add base chance to weapon data
    context.weapons = context.weapons.map((w) => {
      const skill = context.skills.find((s) => s.name === w.system.associatedSkill);
      if (!skill) {
        ui.notifications.warn(
          game.i18n.format('ZWEI.othermessages.noskillweapon', { skill: w.system.associatedSkill, weapon: w.name }),
          { permanent: true }
        );
        return w;
      }

      const baseChance =
        context.document.system.stats.primaryAttributes[skill.system.associatedPrimaryAttribute.toLowerCase()].value;
      w.chance = baseChance + skill.system.bonus;

      return w;
    });

    return context;
  }

  _getItemGroups(sheetData) {
    return {
      weapons: {
        title: 'attackprofiles',
        type: 'weapon',
        summaryTemplate: 'item-summary/weapon',
        rollType: 'weapon-roll',
        rollLabelKey: 'system.associatedSkill',
        details: [
          {
            title: 'distance',
            size: 120,
            key: 'system.distance.value',
            class: 'inject-data',
          },
          {
            title: 'chance',
            size: 70,
            key: 'chance',
          },
          {
            title: 'load',
            size: 55,
            key: 'system.ranged.load',
          },
        ],
        items: sheetData.weapons,
      },
      trappings: {
        title: 'loot',
        type: 'trapping',
        summaryTemplate: 'item-summary/trapping',
        details: [
          {
            title: 'qty',
            size: 50,
            key: 'system.quantity',
          },
        ],
        items: sheetData.trappings,
      },
      traits: {
        title: 'traits',
        type: 'trait',
        summaryTemplate: 'item-summary/trait',
        details: [],
        items: sheetData.traits,
      },
      spells: {
        title: 'spells',
        type: 'spell',
        summaryTemplate: 'item-summary/spell',
        rollType: 'spell-roll',
        rollLabel: sheetData.system.stats.secondaryAttributes.magick.associatedSkill,
        details: [],
        items: sheetData.spells,
      },
      taints: {
        title: 'taintschaos',
        type: 'taint',
        summaryTemplate: 'item-summary/taint',
        details: [],
        items: sheetData.taints,
      },
      conditions: {
        title: 'conditions',
        type: 'condition',
        summaryTemplate: 'item-summary/condition',
        details: [],
        items: sheetData.conditions,
      },
      injuries: {
        title: 'injuries',
        type: 'injury',
        summaryTemplate: 'item-summary/injury',
        details: [],
        items: sheetData.injuries,
      },
    };
  }

  async _onRender(options) {
    await super._onRender(options);

    const html = $(this.element); // @todo: refactor jQuery

    // register width listener for skills container
    this._registerDimensionChangeListener(
      html.find('.skills-container'),
      this._getDimensionBreakpointsCallback('innerWidth', [
        {
          at: 260,
          callback: (toggle) => html.find('.skills-list').toggleClass('two-rows', toggle),
        },
      ])
    );
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    // level skills
    html.find('.skills .skill').contextmenu(async (event) => {
      const skillId = event.currentTarget.dataset.itemId;
      const skillName = this.actor.items.get(skillId).name;
      const ranks = this.actor.system.skillRanks;
      ranks[skillName] = ((ranks[skillName] ?? 0) + 1) % 4;
      await this.actor.update({ 'system.skillRanks': ranks });
    });
    // level bonus advances
    const updateBonusAdvances = (i) => async (event) => {
      const pa = event.currentTarget.dataset.primaryAttribute;
      const bonusAdvances = this.actor.system.stats.primaryAttributes[pa]?.bonusAdvances + i;
      await this.actor.update({
        [`system.stats.primaryAttributes.${pa}.bonusAdvances`]: bonusAdvances,
      });
    };
    html.find('.pa-bonus-advance-substract').click(updateBonusAdvances(-1));
    html.find('.pa-bonus-advance-add').click(updateBonusAdvances(1));
    // manual mode
    html
      .find('.manual-mode-button')
      .click(async () => {
        await this.actor.update({
          'system.stats.manualMode': !this.actor.system.stats.manualMode,
        });
      })
      .contextmenu(async () => {
        if (!this.actor.system.stats.manualMode) {
          const sa = this.actor.system.stats.secondaryAttributes;
          const x = 'system.stats.secondaryAttributes';
          await this.actor.update({
            [`${x}.movement.value`]: sa.movement.value,
            [`${x}.movement.fly`]: sa.movement.fly,
            [`${x}.initiative.value`]: sa.initiative.value,
            [`${x}.parry.value`]: sa.parry.value,
            [`${x}.dodge.value`]: sa.dodge.value,
            [`${x}.damageThreshold.value`]: sa.damageThreshold.value,
            [`${x}.perilThreshold.value`]: sa.perilThreshold.value,
          });
        }
      });
    html.find('.primary-attributes .pa').contextmenu(async (event) => {
      const key = event.currentTarget.dataset.primaryAttribute;
      const paValue = this.actor.system.stats.primaryAttributes[key].value;
      const rf = this.actor.system.details.riskFactor.value;
      const paArray = rf < 3 ? [40, 45, 50, 35] : [50, 55];
      function mod(n, m) {
        // fix js mod bug -> maybe move this to utils
        return ((n % m) + m) % m;
      }
      const i = mod(paArray.indexOf(paValue) + (event.shiftKey ? -1 : 1), paArray.length);
      await this.actor.update({
        [`system.stats.primaryAttributes.${key}.value`]: paArray[i],
      });
    });
  }
}

// @todo: fix later
/*
  async _render(force, options) {
    if (this.actor.limited) {
      options.classes = [
        'limited',
        ...this.constructor.defaultOptions.classes,
        ...(options.classes?.length ? options.classes : []),
      ];
      options.height = 'auto';
      options.width = 350;
      options.resizable = false;
    }
    await super._render(force, options);
  }
*/
