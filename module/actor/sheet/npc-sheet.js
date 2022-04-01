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
        key: 'age.value',
        placeholder: 'Age Group'
      },
      {
        key: 'sex.value',
        placeholder: 'Sex'
      },
      {
        key: 'ancestry.value',
        placeholder: 'Ancestry'
      },
      {
        key: 'height.value',
        placeholder: 'Height'
      },
      {
        key: 'build.value',
        placeholder: 'Build'
      },
      {
        key: 'complexion.value',
        placeholder: 'Complexion'
      },
      {
        key: 'mannerOfDress.value',
        placeholder: 'Manner of Dress'
      },
      {
        key: 'socialClass.value',
        placeholder: 'Social Class',
        hidden: this.actor.limited
      },
      {
        key: 'distinguishingMarks.value',
        placeholder: 'Distinguishing Marks'
      },
      {
        key: 'archetype.value',
        placeholder: 'Archetype',
        hidden: this.actor.limited
      },
      {
        key: 'motivation.value',
        placeholder: 'Motivation',
        hidden: this.actor.limited
      },
      {
        key: 'alignment.value',
        placeholder: 'Alignment',
        hidden: this.actor.limited
      },
      {
        key: 'languages',
        placeholder: '?',
        template: 'partials/detail-languages',
        hidden: this.actor.limited
      }
    ];
    return sheetData;
  }

}