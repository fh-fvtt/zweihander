import ZweihanderBaseActorSheet from "./base-actor-sheet";

 export default class ZweihanderNpcSheet extends ZweihanderBaseActorSheet {

  static unsupportedItemTypes = new Set([
    'ancestry',
    'profession',
    'quality',
    'skill',
    'uniqueAdvance'
  ]);

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["zweihander", "sheet", "npc", "damage-tracker"],
      template: "systems/zweihander/templates/npc/main.hbs",
      width: 750,
      height: 900,
      resizable: true,
      tabs: [
        { navSelector: ".sheet-navigation", contentSelector: ".sheet-body", initial: "main" }
      ],
      scrollY: ['.save-scroll']
    });
  }

  getData(options) {
    const sheetData = super.getData();
    return sheetData;
  }

}