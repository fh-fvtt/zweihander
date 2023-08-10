import ZweihanderBaseActorSheet from './base-actor-sheet';

import { selectedChoice } from '../../utils';

export default class ZweihanderVehicleSheet extends ZweihanderBaseActorSheet {
  static unsupportedItemTypes = new Set([
    'ancestry',
    'profession',
    'skill',
    'uniqueAdvance',
    'talent',
    'armor',
    'ritual',
    'disorder',
    'disease',
    'weapon',
  ]);

  static get defaultOptions() {
    const compactMode = game.settings.get('zweihander', 'openInCompactMode');
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: super.defaultOptions.classes.concat(['vehicle']),
      template: 'systems/zweihander/src/templates/vehicle/main.hbs',
      width: compactMode ? 540 : 620,
      height: compactMode ? 540 : 669,
      scrollY: ['.save-scroll', '.sheet-body'],
    });
  }

  async getData(options) {
    const sheetData = await super.getData();

    sheetData.choices = {};

    const associatedPrimaryAttribute =
      sheetData.system.details.associatedPrimaryAttribute ?? game.i18n.localize('ZWEI.actor.primary.brawn');
    sheetData.choices.associatedPrimaryAttribute = selectedChoice(associatedPrimaryAttribute, [
      { value: 'combat', label: 'combat' },
      { value: 'brawn', label: 'brawn' },
      { value: 'agility', label: 'agility' },
      { value: 'perception', label: 'perception' },
      { value: 'intelligence', label: 'intelligence' },
      { value: 'willpower', label: 'willpower' },
      { value: 'fellowship', label: 'fellowship' },
    ]);

    const hidden = this.actor.limited;
    sheetData.details = [
      {
        key: 'details.associatedPrimaryAttribute',
        choices: sheetData.choices.associatedPrimaryAttribute,
      },
      {
        key: 'details.operateSkill',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.operateSkill'),
        hidden,
      },
      {
        key: 'details.horsepower',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.horsepower'),
        hidden,
      },
    ];
    const $$ = (x) => sheetData.itemGroups[x];
    sheetData.itemLists = {
      loot: ['trappings'].map($$),
      qualities: ['qualities'].map($$),
      rules: ['drivers', 'passengers'].map($$),
    };
    return sheetData;
  }

  async _prepareItems(sheetData) {
    await super._prepareItems(sheetData);
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
    indexedTypes.forEach((t) => (sheetData[pluralize(t)] = []));
    sheetData.items
      .filter((i) => indexedTypes.includes(i.type))
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .forEach((i) => sheetData[pluralize(i.type)].push(i));

    return sheetData;
  }

  _getItemGroups(sheetData) {
    return {
      trappings: {
        title: 'trappings',
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
      qualities: {
        title: 'qualities',
        type: 'quality',
        summaryTemplate: 'item-summary/quality',
        details: [],
        items: sheetData.qualities,
      },
      drivers: {
        title: 'drivers',
        type: 'quality',
        summaryTemplate: 'item-summary/quality',
        details: [],
        items: sheetData.qualities,
      },
      passengers: {
        title: 'passengers',
        type: 'quality',
        summaryTemplate: 'item-summary/quality',
        details: [],
        items: sheetData.qualities,
      },
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
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
    if (!this.options.editable) return;

    // Update the encumbrance meter
    this._updateEncumbranceMeter(html);

    // manual mode
    html
      .find('.manual-mode-button')
      .click(() => {
        this.actor.update({
          'system.stats.manualMode': !this.actor.system.stats.manualMode,
        });
      })
      .contextmenu(() => {
        if (!this.actor.system.stats.manualMode) {
          const sa = this.actor.system.stats.secondaryAttributes;
          const x = 'system.stats.secondaryAttributes';
          this.actor.update({
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
  }

  _updateEncumbranceMeter(html) {
    const encumbranceData = this.actor.system.stats.secondaryAttributes.encumbrance;
    const currentEncumbrance = encumbranceData.current;
    const totalEncumbrance = encumbranceData.value;
    let ratio = (currentEncumbrance / totalEncumbrance) * 100;
    if (ratio > 100) {
      ratio = 100;
      html.find('.encumbrance-bar-container').addClass('encumbrance-overage');
    }
    html.find('.encumbrance-bar').css('width', ratio + '%');
  }

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
}
