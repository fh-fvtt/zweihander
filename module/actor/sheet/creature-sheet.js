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
      classes: ["zweihander", "sheet", "actor", "creature" ,"damage-tracker"],
      template: "systems/zweihander/templates/creature/main.hbs",
      width: 620,
      height: 669,
      resizable: true,
      scrollY: ['.save-scroll', '.sheet-body']
    });
  }

  getData(options) {
    const sheetData = super.getData();
    return sheetData;
  }

  _prepareItems(data) {
    // set up collections for all item types
    const indexedTypes = [
      "trapping", "condition", "injury", "disease", "disorder", "profession",
      "ancestry", "armor", "weapon", "spell", "ritual", "talent", "trait",
      "drawback", "quality", "skill", "uniqueAdvance", "taint"
    ].filter(t => t === 'skill' || !this.constructor.unsupportedItemTypes.has(t));
    const pluralize = t => ({
      'injury': 'injuries',
      'ancestry': 'ancestry',
      'armor': 'armor',
      'quality': 'qualities'
    }[t] ?? t + "s");
    indexedTypes.forEach(t => data[pluralize(t)] = []);
    data.items
      .filter(i => indexedTypes.includes(i.type))
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .forEach(i => data[pluralize(i.type)].push(i));
    // sort skills alphabetically
    data.skills = data.skills.sort((a, b) => a.name.localeCompare(b.name));
    // add source information from flags
    const addSource = (items) => items.map(i => ({
      ...i,
      source: i.flags.zweihander?.source?.label ?? 'Manual',
      isManualSource: i.flags.zweihander?.source?.label ? false : true
    }));
    data.drawbacks = addSource(data.drawbacks);
    data.traits = addSource(data.traits);
    data.talents = addSource(data.talents);
  }

  _onDragDrop(event) {
  console.log(event);  
  }

  activateListeners(html) {
    super.activateListeners(html);
    const autoSizeInput = (el) => el.attr('size', Math.max(el.attr('placeholder').length, el.val().length));
    const inputsToAutoSize = html.find('aside.details input.auto-size');
    inputsToAutoSize.toArray().forEach(x => autoSizeInput($(x)));
    inputsToAutoSize.bind('input', (event) => autoSizeInput($(event.currentTarget)));
  }

}
  