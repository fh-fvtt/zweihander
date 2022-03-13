import ZweihanderBaseActorSheet from "./base-actor-sheet";

 export default class ZweihanderCreatureSheet extends ZweihanderBaseActorSheet {


  static unsupportedItemTypes = new Set([
    'ancestry',
    'profession',
    'quality',
    'skill',
    'uniqueAdvance'
  ]);

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["zweihander", "sheet", "creature" ,"damage-tracker"],
      template: "systems/zweihander/templates/creature/main.hbs",
      width: 620,
      height: 630,
      resizable: true,
      scrollY: ['.save-scroll']
    });
  }

  getData(options) {
    const sheetData = super.getData();
    return sheetData;
  }

  activateListeners(html) {
    super.activateListeners(html);
    const autoSizeInput = (el) => el.attr('size', Math.max(el.attr('placeholder').length, el.val().length));
    const inputsToAutoSize = html.find('aside.details input.auto-size');
    inputsToAutoSize.toArray().forEach(x => autoSizeInput($(x)));
    inputsToAutoSize.bind('input', (event) => autoSizeInput($(event.currentTarget)));
  }

}
  