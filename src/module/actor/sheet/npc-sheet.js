import { selectedChoice } from '../../utils';
import ZweihanderCreatureSheet from './creature-sheet';

export default class ZweihanderNpcSheet extends ZweihanderCreatureSheet {
  static unsupportedItemTypes = new Set(['ancestry', 'profession', 'quality', 'skill', 'uniqueAdvance']);

  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ['npc'],
    window: {
      icon: 'fa-solid fa-handshake-angle',
    },
  };

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);

    const compactMode = game.settings.get('zweihander', 'openInCompactMode');

    initialized.position.height = compactMode ? 560 : 763;

    return initialized;
  }

  async _prepareContext(options) {
    const sheetData = await super._prepareContext(options);
    sheetData.details = [
      {
        choices: sheetData.choices,
        template: 'partials/detail-risk-factor',
        hidden: this.actor.limited,
      },
      {
        key: 'details.age',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.agegroup'),
      },
      {
        key: 'details.sex',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.sex'),
      },
      {
        key: 'details.ancestry',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.ancestry'),
      },
      {
        key: 'details.height',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.height'),
      },
      {
        key: 'details.build',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.build'),
      },
      {
        key: 'details.complexion',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.complexion'),
      },
      {
        key: 'details.mannerOfDress',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.manner'),
      },
      {
        key: 'details.socialClass',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.socialclass'),
        hidden: this.actor.limited,
      },
      {
        key: 'details.distinguishingMarks',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.marks'),
      },
      {
        key: 'details.archetype',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.archetype'),
        choices: selectedChoice(
          this.actor.system.details.archetype ?? CONFIG.ZWEI.archetypes[0],
          CONFIG.ZWEI.archetypes.map((a) => ({ value: a, label: a }))
        ),
        hidden: this.actor.limited,
      },
      {
        key: 'details.motivation',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.motivation'),
        hidden: this.actor.limited,
      },
      {
        key: 'details.alignment',
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.alignment'),
        hidden: this.actor.limited,
      },
      {
        value: sheetData.system.languages,
        placeholder: game.i18n.localize('ZWEI.actor.details.placeholders.languages'),
        template: 'partials/detail-languages',
        hidden: this.actor.limited,
      },
    ];
    const $$ = (x) => sheetData.itemGroups[x];
    sheetData.itemLists = {
      attackProfiles: ['weapons'].map($$),
      loot: ['trappings', 'armor'].map($$),
      rules: [
        'traits',
        'talents',
        'drawbacks',
        'spells',
        'rituals',
        'taints',
        'conditions',
        'injuries',
        'disorders',
        'diseases',
      ].map($$),
    };
    return sheetData;
  }

  _getItemGroups(groupsData) {
    const itemGroups = super._getItemGroups(groupsData);
    itemGroups.talents = {
      title: 'talents',
      type: 'talent',
      summaryTemplate: 'item-summary/talent',
      details: [],
      items: groupsData.talents,
    };
    itemGroups.drawbacks = {
      title: 'drawbacks',
      type: 'drawback',
      summaryTemplate: 'item-summary/drawback',
      details: [],
      items: groupsData.drawbacks,
    };
    itemGroups.rituals = {
      title: 'rituals',
      type: 'ritual',
      summaryTemplate: 'item-summary/ritual',
      details: [],
      items: groupsData.rituals,
    };
    itemGroups.disorders = {
      title: 'disorders',
      type: 'disorder',
      summaryTemplate: 'item-summary/disorder',
      details: [],
      items: groupsData.disorders,
    };
    itemGroups.diseases = {
      title: 'diseases',
      type: 'disease',
      summaryTemplate: 'item-summary/disease',
      details: [],
      items: groupsData.diseases,
    };
    itemGroups.armor = {
      title: 'armor',
      type: 'armor',
      summaryTemplate: 'item-summary/armor',
      details: [],
      items: groupsData.armor,
    };
    return itemGroups;
  }
}
