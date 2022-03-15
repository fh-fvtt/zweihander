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
      classes: ["zweihander", "sheet", "actor", "creature", "damage-tracker"],
      template: "systems/zweihander/templates/creature/main.hbs",
      width: 620,
      height: 669,
      resizable: true,
      scrollY: ['.save-scroll', '.sheet-body']
    });
  }

  getData(options) {
    const sheetData = super.getData();
    sheetData.itemGroups = {
      attackProfiles: [
        {
          title: "Attack Profiles",
          type: "weapon",
          packs: "zweihander.weapons,zweihander.weapons-alt-damage",
          summaryTemplate: "item-summary/weapon",
          rollType: "weapon-roll",
          rollLabelKey: "data.associatedSkill.value",
          details: [
            {
              title: "Chance",
              size: 50,
              key: "chance"
            },
            {
              title: "Load",
              size: 40,
              key: "data.load.value"
            }
          ],
          items: sheetData.weapons
        }
      ]
    }
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
    // add base chance to weapon data
    data.weapons = data.weapons.map(w => {
      const skill = data.skills.find(s => s.name === w.data.associatedSkill.value);
      const baseChance = data.data.stats.primaryAttributes[skill.data.associatedPrimaryAttribute.value.toLowerCase()].value;
      w.chance = baseChance + skill.data.bonus;
      return w;
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    // auto size the details inputs
    const autoSizeInput = (el) => el.attr('size', Math.max(el.attr('placeholder').length, el.val().length));
    const inputsToAutoSize = html.find('aside.details input.auto-size');
    inputsToAutoSize.each((i, x) => autoSizeInput($(x)));
    inputsToAutoSize.bind('input', (event) => autoSizeInput($(event.currentTarget)));
    // register width listener for skills container
    this._registerWidthListener(html, '.skills-container', [{
      width: 265,
      callback: (toggle) => html.find('.skills-list').toggleClass('two-rows', toggle)
    }]);
  }

}
