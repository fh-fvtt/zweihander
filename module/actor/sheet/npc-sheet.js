import ZweihanderCreatureSheet from "./creature-sheet";

 export default class ZweihanderNpcSheet extends ZweihanderCreatureSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["zweihander", "sheet", "npc", "damage-tracker"],
      template: "systems/zweihander/templates/npc/main.hbs",
      width: 500,
      height: 650,
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

  activateListeners(html) {
    super.activateListeners(html);
  }

}