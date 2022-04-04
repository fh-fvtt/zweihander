import { assignPacks } from "../../utils";
import ZweihanderCreatureSheet from "./creature-sheet";

 export default class ZweihanderNpcSheet extends ZweihanderCreatureSheet {

    static unsupportedItemTypes = new Set([
    'ancestry',
    'profession',
    'quality',
    'skill',
    'uniqueAdvance'
  ]);

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: super.defaultOptions.classes.concat(['npc'])
    });
  }

  getData(options) {
    const sheetData = super.getData();
    sheetData.itemGroups.rules.splice(1, 0, {
        title: "Talents",
        type: "talent",
        summaryTemplate: "item-summary/talent",
        details: [],
        items: sheetData.talents
    });
    sheetData.itemGroups.rules.splice(3, 0, {
        title: "Rituals",
        type: "ritual",
        summaryTemplate: "item-summary/ritual",
        details: [],
        items: sheetData.rituals
    });
    sheetData.itemGroups.rules.push(
      {
        title: "Disorders",
        type: "disorder",
        summaryTemplate: "item-summary/disorder",
        details: [],
        items: sheetData.disorders
      },
      {
        title: "Diseases",
        type: "disease",
        summaryTemplate: "item-summary/disease",
        details: [],
        items: sheetData.diseases
      },
    );
    sheetData.itemGroups.loot.push(
      {
        title: "Armor",
        type: "armor",
        summaryTemplate: "item-summary/armor",
        details: [],
        items: sheetData.armor
      },
    )
    assignPacks('npc', sheetData.itemGroups);
    sheetData.details = [
      {
        key: 'details.age',
        placeholder: 'Age Group'
      },
      {
        key: 'details.sex',
        placeholder: 'Sex'
      },
      {
        key: 'details.ancestry',
        placeholder: 'Ancestry'
      },
      {
        key: 'details.height',
        placeholder: 'Height'
      },
      {
        key: 'details.build',
        placeholder: 'Build'
      },
      {
        key: 'details.complexion',
        placeholder: 'Complexion'
      },
      {
        key: 'details.mannerOfDress',
        placeholder: 'Manner of Dress'
      },
      {
        key: 'details.socialClass',
        placeholder: 'Social Class',
        hidden: this.actor.limited
      },
      {
        key: 'details.distinguishingMarks',
        placeholder: 'Distinguishing Marks'
      },
      {
        key: 'details.archetype',
        placeholder: 'Archetype',
        hidden: this.actor.limited
      },
      {
        key: 'details.motivation',
        placeholder: 'Motivation',
        hidden: this.actor.limited
      },
      {
        key: 'details.alignment',
        placeholder: 'Alignment',
        hidden: this.actor.limited
      },
      {
        value: sheetData.data.languages,
        placeholder: '?',
        template: 'partials/detail-languages',
        hidden: this.actor.limited
      }
    ];
    return sheetData;
  }

}