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

  static get defaultOptions() {
    const compactMode = game.settings.get('zweihander', 'openInCompactMode');
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: super.defaultOptions.classes.concat(['creature']),
      template: 'systems/zweihander/templates/creature/main.hbs',
      width: compactMode ? 540 : 620,
      height: compactMode ? 540 : 669,
      scrollY: ['.save-scroll', '.sheet-body'],
    });
  }

  getData(options) {
    const sheetData = super.getData();
    sheetData.choices = {};
    const size = sheetData.system.details.size ?? 1;
    sheetData.choices.sizes = selectedChoice(size, [
      { value: 0, label: 'Small (S)' },
      { value: 1, label: 'Normal (N)' },
      { value: 2, label: 'Large (L)' },
      { value: 3, label: 'Huge (H)' },
    ]);
    const rf = sheetData.system.details.riskFactor?.value ?? 0;
    sheetData.choices.riskFactors = selectedChoice(rf, [
      { value: 0, label: 'Basic' },
      { value: 1, label: 'Intermediate' },
      { value: 2, label: 'Advanced' },
      { value: 3, label: 'Elite' },
    ]);
    const notch = sheetData.system.details.riskFactor?.notch ?? 1;
    sheetData.choices.notches = selectedChoice(notch, [
      { value: 0, label: '(Low)' },
      { value: 1, label: '(Medium)' },
      { value: 2, label: '(High)' },
      { value: 3, label: '(Unique)' },
    ]);
    const hidden = this.actor.limited;
    sheetData.details = [
      {
        choices: sheetData.choices,
        template: 'partials/detail-risk-factor',
        hidden,
      },
      {
        key: 'details.size',
        choices: sheetData.choices.sizes,
      },
      {
        key: 'details.classification',
        placeholder: 'Classification',
        hidden,
      },
      {
        key: 'details.role',
        placeholder: 'Role',
        hidden,
      },
      {
        key: 'details.influences',
        placeholder: 'Influences',
        hidden,
      },
      {
        value: sheetData.system.languages,
        placeholder: '?',
        template: 'partials/detail-languages',
        hidden,
      },
    ];
    const $$ = (x) => sheetData.itemGroups[x];
    sheetData.itemLists = {
      attackProfiles: ['weapons'].map($$),
      loot: ['trappings'].map($$),
      rules: ['traits', 'spells', 'taints', 'conditions', 'injuries'].map($$),
    };
    return sheetData;
  }

  _prepareItems(sheetData) {
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
    indexedTypes.forEach((t) => (sheetData[pluralize(t)] = []));
    sheetData.items
      .filter((i) => indexedTypes.includes(i.type))
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .forEach((i) => sheetData[pluralize(i.type)].push(i));
    // sort skills alphabetically
    sheetData.skills = sheetData.skills.sort((a, b) => a.name.localeCompare(b.name));
    // add base chance to weapon data
    sheetData.weapons = sheetData.weapons.map((w) => {
      const skill = sheetData.skills.find((s) => s.name === w.system.associatedSkill);
      const baseChance =
        system.stats.primaryAttributes[
          skill.system.associatedPrimaryAttribute.toLowerCase()
        ].value;
      w.chance = baseChance + skill.system.bonus;
      return w;
    });
  }

  _getItemGroups(sheetData) {
    return {
      weapons: {
        title: 'Attack Profiles',
        type: 'weapon',
        summaryTemplate: 'item-summary/weapon',
        rollType: 'weapon-roll',
        rollLabelKey: 'system.associatedSkill',
        details: [
          {
            title: 'Distance',
            size: 120,
            key: 'system.distance',
            class: 'inject-data',
          },
          {
            title: 'Chance',
            size: 70,
            key: 'chance',
          },
          {
            title: 'Load',
            size: 55,
            key: 'system.load',
          },
        ],
        items: sheetData.weapons,
      },
      trappings: {
        title: 'Loot',
        type: 'trapping',
        summaryTemplate: 'item-summary/trapping',
        details: [
          {
            title: 'Qty.',
            size: 50,
            key: 'system.quantity',
          },
        ],
        items: sheetData.trappings,
      },
      traits: {
        title: 'Traits',
        type: 'trait',
        summaryTemplate: 'item-summary/trait',
        details: [],
        items: sheetData.traits,
      },
      spells: {
        title: 'Spells',
        type: 'spell',
        summaryTemplate: 'item-summary/spell',
        rollType: 'spell-roll',
        rollLabel: system.stats.secondaryAttributes.magick.associatedSkill,
        details: [],
        items: sheetData.spells,
      },
      taints: {
        title: 'Taints of Chaos',
        type: 'taint',
        summaryTemplate: 'item-summary/taint',
        details: [],
        items: sheetData.taints,
      },
      conditions: {
        title: 'Conditions',
        type: 'condition',
        summaryTemplate: 'item-summary/condition',
        details: [],
        items: sheetData.conditions,
      },
      injuries: {
        title: 'Injuries',
        type: 'injury',
        summaryTemplate: 'item-summary/injury',
        details: [],
        items: sheetData.injuries,
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
    // level skills
    html.find('.skills .skill').contextmenu((event) => {
      const skillId = event.currentTarget.dataset.itemId;
      const skillName = this.actor.items.get(skillId).name;
      const ranks = this.actor.system.skillRanks;
      ranks[skillName] = ((ranks[skillName] ?? 0) + 1) % 4;
      this.actor.update({ 'system.skillRanks': ranks });
    });
    // level bonus advances
    const updateBonusAdvances = (i) => (event) => {
      const pa = event.currentTarget.dataset.primaryAttribute;
      const bonusAdvances =
        this.actor.system.stats.primaryAttributes[pa]?.bonusAdvances + i;
      this.actor.update({
        [`system.stats.primaryAttributes.${pa}.bonusAdvances`]: bonusAdvances,
      });
    };
    html.find('.pa-bonus-advance-substract').click(updateBonusAdvances(-1));
    html.find('.pa-bonus-advance-add').click(updateBonusAdvances(1));
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
    html.find('.primary-attributes .pa').contextmenu((event) => {
      const key = event.currentTarget.dataset.primaryAttribute;
      const paValue = this.actor.system.stats.primaryAttributes[key].value;
      const rf = this.actor.system.details.riskFactor.value;
      const paArray = rf < 3 ? [40, 45, 50, 35] : [50, 55];
      function mod(n, m) {
        // fix js mod bug -> maybe move this to utils
        return ((n % m) + m) % m;
      }
      const i = mod(paArray.indexOf(paValue) + (event.shiftKey ? -1 : 1), paArray.length);
      this.actor.update({
        [`system.stats.primaryAttributes.${key}.value`]: paArray[i],
      });
    });
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
