import ZweihanderActorConfig from "../../apps/actor-config";
import ZweihanderBaseActorSheet from "./base-actor-sheet";
import * as ZweihanderDice from "../../dice";
import { attachTabDefinitions } from "./character-sheet-tabs-def";

/**
 * The Zweihänder actor sheet class for characters.
 * @extends {ActorSheet}
 */
export default class ZweihanderCharacterSheet extends ZweihanderBaseActorSheet {

  static unsupportedItemTypes = new Set([
    'quality',
    'skill'
  ]);

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["zweihander", "sheet", "actor", "character", "damage-tracker"],
      template: "systems/zweihander/templates/pc/main.hbs",
      width: 750,
      height: 900,
      resizable: true,
      tabs: [
        { navSelector: ".sheet-navigation", contentSelector: ".sheet-body", initial: "main" }
      ],
      scrollY: ['.save-scroll', '.items-list', '.tab']
    });
  }

  getData(options) {
    const sheetData = super.getData();
    // get actor config
    sheetData.actorConfig = ZweihanderActorConfig.getConfig(this.actor.data);
    // calculate reward points automatically
    if (game.settings.get("zweihander", "trackRewardPoints")) {
      const tierMultiplier = {
        "Basic": 100,
        "Intermediate": 200,
        "Advanced": 300
      }
      sheetData.data.rewardPoints.spent = sheetData.professions
        .map(profession => tierMultiplier[profession.data.tier.value] * profession.data.tier.advancesPurchased)
        .concat(sheetData.uniqueAdvances.map(advance => advance.data.rewardPointCost.value))
        .reduce((a, b) => a + b, 0);
      sheetData.data.rewardPoints.current = sheetData.data.rewardPoints.total - sheetData.data.rewardPoints.spent;
    }
    attachTabDefinitions(sheetData);
    return sheetData;
  }

  _prepareItems(data) {
    // set up collections for all item types
    const indexedTypes = [
      "trapping", "condition", "injury", "disease", "disorder", "profession",
      "ancestry", "armor", "weapon", "spell", "ritual", "talent", "trait",
      "drawback", "quality", "skill", "uniqueAdvance", "taint"
    ];
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
    // sort professions by tier
    data.professions = data.professions.sort((a, b) =>
      CONFIG.ZWEI.tiersInversed[a.data.tier.value] - CONFIG.ZWEI.tiersInversed[b.data.tier.value]
    );
    // add source information from flags
    const addSource = (items) => items.map(i => ({
      ...i,
      source: i.flags.zweihander?.source?.label ?? 'Manual',
      isManualSource: i.flags.zweihander?.source?.label ? false : true
    }));
    data.drawbacks = addSource(data.drawbacks);
    data.traits = addSource(data.traits);
    data.talents = addSource(data.talents);
    // filter purchased talents
    data.talents = data.talents.filter(talent => talent.isManualSource ||
      data.professions.some(p => p.data.talents.some(t => t.linkedId === talent._id && t.purchased))
    );
  }

  activateListeners(html) {
    super.activateListeners(html);

    this._registerWidthListener(html, '.skills-container', [{
      width: 275,
      callback: (toggle) => html.find('.skills-list').toggleClass('two-rows', toggle)
    }]);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Edit Ancestry Item
    html.find('.ancestry-edit-button').click(() => {
      const ancestryId = this.actor.data.items.find(i => i.type === 'ancestry').id;
      const ancestryItem = this.actor.items.get(ancestryId);
      ancestryItem.sheet.render(true);
      try {
        ancestryItem.sheet.bringToTop();
      } catch (e) {
        // TODO check if this is a problem. Doesn't seem to be the case. Maybe can be safeguarded.
      }
    });

    // Delete Ancestry Item
    html.find('.ancestry-delete-button').click(async ev => {
      const ancestryId = this.actor.data.items.find(i => i.type === 'ancestry').id;
      await this.actor.deleteEmbeddedDocuments("Item", [ancestryId]);
    });

    const updatePurchased = (event) => {
      const target = $(event.currentTarget);
      const field = target.data('purchaseType');
      const index = target.data('purchaseIndex');
      const professionElement = target.closest(".individual-description").parents(".item");
      const professionItem = this.actor.items.get($(professionElement).data("itemId"));
      const locked = professionItem.data.data.tier.completed && this.actor.data.data.tier !== professionItem.data.data.tier.value;
      if (locked) {
        ui.notifications.error(`Cannot perform operation: ${professionItem.data.data.tier.value} Tier locked.`);
        return;
      }
      const updated = professionItem.data.data[field].map((x, i) => i === index ? { ...x, purchased: !x.purchased } : x);
      professionItem.update({ [`data.${field}`]: updated });
    }
    html.find(".purchase-link").click(updatePurchased);

    // Reset Order and Chaos Ranks
    html.find(".reset-ranks").click(() => {
      this.actor.update({
        "data.chaosRanks.value": "0",
        "data.orderRanks.value": "0"
      });
    });
    // Update the encumbrance meter
    this._updateEncumbranceMeter(html);

    html.find(".peril-rolls .image-container").click(async (event) => {
      const perilType = ZweihanderDice.PERIL_ROLL_TYPES[event.currentTarget.dataset.perilType.toUpperCase()];
      ZweihanderDice.rollPeril(perilType, this.actor);
    })
  }

  _updateEncumbranceMeter(html) {
    const encumbranceData = this.actor.data.data.stats.secondaryAttributes.encumbrance;
    const currentEncumbrance = encumbranceData.current;
    const totalEncumbrance = encumbranceData.value;
    let ratio = (currentEncumbrance / totalEncumbrance) * 100;
    if (ratio > 100) {
      ratio = 100;
      html.find(".encumbrance-bar-container").addClass("encumbrance-overage");
    }
    html.find(".encumbrance-bar").css("width", ratio + "%");
  }

}
