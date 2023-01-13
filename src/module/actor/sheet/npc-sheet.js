import { ZWEI } from '../../config';
import { assignPacks, selectedChoice } from '../../utils';
import ZweihanderCreatureSheet from './creature-sheet';

export default class ZweihanderNpcSheet extends ZweihanderCreatureSheet {
  static unsupportedItemTypes = new Set(['ancestry', 'profession', 'quality', 'skill', 'uniqueAdvance']);

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: super.defaultOptions.classes.concat(['npc']),
    });
  }

  getData(options) {
    const sheetData = super.getData();
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
      title: 'Talents',
      type: 'talent',
      summaryTemplate: 'item-summary/talent',
      details: [],
      items: groupsData.talents,
    };
    itemGroups.rituals = {
      title: 'Rituals',
      type: 'ritual',
      summaryTemplate: 'item-summary/ritual',
      details: [],
      items: groupsData.rituals,
    };
    itemGroups.disorders = {
      title: 'Disorders',
      type: 'disorder',
      summaryTemplate: 'item-summary/disorder',
      details: [],
      items: groupsData.disorders,
    };
    itemGroups.diseases = {
      title: 'Diseases',
      type: 'disease',
      summaryTemplate: 'item-summary/disease',
      details: [],
      items: groupsData.diseases,
    };
    itemGroups.armor = {
      title: 'Armor',
      type: 'armor',
      summaryTemplate: 'item-summary/armor',
      details: [],
      items: groupsData.armor,
    };
    return itemGroups;
  }
}
