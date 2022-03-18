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
        packs: "zweihander.zh-talents",
        summaryTemplate: "item-summary/talent",
        details: [],
        items: sheetData.talents
    });
    sheetData.itemGroups.rules.splice(3, 0, {
        title: "Rituals",
        type: "ritual",
        packs: "zweihander.zh-rituals",
        summaryTemplate: "item-summary/ritual",
        details: [],
        items: sheetData.rituals
    });
    sheetData.itemGroups.rules.push(
      {
        title: "Disorders",
        type: "disorder",
        packs: "zweihander.zh-disorders",
        summaryTemplate: "item-summary/disorder",
        details: [],
        items: sheetData.disorders
      },
      {
        title: "Diseases",
        type: "disease",
        packs: "zweihander.zh-diseases",
        summaryTemplate: "item-summary/disease",
        details: [],
        items: sheetData.diseases
      },
    );
    sheetData.itemGroups.loot.push(
      {
        title: "Armor",
        type: "armor",
        packs: "zweihander.zh-armor",
        summaryTemplate: "item-summary/armor",
        details: [],
        items: sheetData.armor
      },
    )
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
        placeholder: 'Social Class'
      },
      {
        key: 'distinguishingMarks.value',
        placeholder: 'Distinguishing Marks'
      },
      {
        key: 'archetype.value',
        placeholder: 'Archetype'
      },
      {
        key: 'motivation.value',
        placeholder: 'Motivation'
      },
      {
        key: 'alignment.value',
        placeholder: 'Alignment'
      },
      {
        key: 'languages.value',
        placeholder: 'Languages'
      }
    ];
    return sheetData;
  }

}