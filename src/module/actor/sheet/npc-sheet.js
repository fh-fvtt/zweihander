import { ZWEI } from '../../config';
import { assignPacks, selectedChoice } from '../../utils';
import ZweihanderCreatureSheet from './creature-sheet';

export default class ZweihanderNpcSheet extends ZweihanderCreatureSheet {
  static unsupportedItemTypes = new Set([
    'ancestry',
    'profession',
    'quality',
    'skill',
    'uniqueAdvance',
  ]);

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
        hidden: this.actor.limited
      },
      {
        key: 'details.age',
        placeholder: 'Age Group',
      },
      {
        key: 'details.sex',
        placeholder: 'Sex',
      },
      {
        key: 'details.ancestry',
        placeholder: 'Ancestry',
      },
      {
        key: 'details.height',
        placeholder: 'Height',
      },
      {
        key: 'details.build',
        placeholder: 'Build',
      },
      {
        key: 'details.complexion',
        placeholder: 'Complexion',
      },
      {
        key: 'details.mannerOfDress',
        placeholder: 'Manner of Dress',
      },
      {
        key: 'details.socialClass',
        placeholder: 'Social Class',
        hidden: this.actor.limited,
      },
      {
        key: 'details.distinguishingMarks',
        placeholder: 'Distinguishing Marks',
      },
      {
        key: 'details.archetype',
        placeholder: 'Archetype',
        choices: selectedChoice(
          this.actor.system.details.archetype ?? CONFIG.ZWEI.archetypes[0],
          CONFIG.ZWEI.archetypes.map((a) => ({ value: a, label: a }))
        ),
        hidden: this.actor.limited,
      },
      {
        key: 'details.motivation',
        placeholder: 'Motivation',
        hidden: this.actor.limited,
      },
      {
        key: 'details.alignment',
        placeholder: 'Alignment',
        hidden: this.actor.limited,
      },
      {
        value: sheetData.system.languages,
        placeholder: '?',
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
