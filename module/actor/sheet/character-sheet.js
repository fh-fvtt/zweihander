import ZweihanderActorConfig from "../../apps/actor-config";
import ZweihanderQuality from "../../item/entity/quality";
import ZweihanderBaseActorSheet from "./base-actor-sheet";
import * as ZweihanderUtils from "../../utils";
import * as ZweihanderDice from "../../dice";
import ZweihanderProfession from "../../item/entity/profession";
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

    const actor = this.actor;
    const actorData = this.actor.data;

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    this._registerWidthListener(html, '.skills-container', [{
      width: 265,
      callback: (toggle) => html.find('.skills-list').toggleClass('two-rows', toggle)
    }]);

    // Edit Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(async ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      await Dialog.confirm({
        title: `Delete Embedded Item: ${item.name}`,
        content: "<p>Are you sure?</p><p>This item will be permanently deleted and cannot be recovered.</p>",
        yes: async () => {
          await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
          li.slideUp(200, () => this.render(false));
        },
        no: () => { },
        defaultYes: true
      });
    });

    html.find('.skill').hover(async ev => {
      let target = "li.pa.pa-" + ev.currentTarget.attributes['data-associated-pa'].value.toLowerCase();
      $(target).addClass('pa-hover-helper');
    }, async ev => {
      let target = "li.pa.pa-" + ev.currentTarget.attributes['data-associated-pa'].value.toLowerCase();
      $(target).removeClass('pa-hover-helper');
    })

    // Add new Item (from within the sheet)
    html.find('.add-new').click(async ev => {
      let type = ev.currentTarget.dataset.itemType;

      const createdItemArray = await this.actor.createEmbeddedDocuments("Item", [
        { "type": type, "name": type }
      ]);

      if (createdItemArray.length)
        createdItemArray[0].sheet.render(true);
    });

    html.find('.add-new').contextmenu(async ev => {
      const packIds = ev.currentTarget.dataset.openPacks?.split(",");
      if (!packIds) {
        ui.notifications.notify(`This item type currently has no system compendium attached!`);
        return
      }
      const packs = packIds.map(x => game.packs.get(x.trim()));
      if (packs.every(x => x.apps[0].rendered)) {
        packs.forEach(x => x.apps[0].close());
      }
      packs.forEach((x, i) => x.render(true, {
        top: actor.sheet.position.top,
        left: actor.sheet.position.left + (i % 2 == 0 ? -350 : actor.sheet.position.width)
      }));

    })

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

    // toFormat.replace(/(@([a-zA-Z0-9]\.)*[a-zA-Z0-9]+)/g, (key) => resolveProperty(actorData, key))

    // Handle formulas for display
    html.find('.inject-data').each(async function () {
      $(this).text(await ZweihanderUtils.parseDataPaths($(this).text().trim(), actor));
    });

    // "Link" checkboxes on character sheet and item sheet so both have the same state
    html.find(".link-checkbox").click(async event => {
      event.preventDefault();

      const li = $(event.currentTarget).closest(".item");
      const item = this.actor.items.get(li.data("itemId"));

      if (item.type === "armor") {
        await item.update({ "data.equipped": event.target.checked });
      } else if (item.type === "profession") {
        if (!event.target.checked && item.data.data.tier.value !== item.actor.data.data.tier) {
          ui.notifications.error(`In order to reset this professions progress you have to delete the profession above it first!`);
          return;
        }
        Dialog.confirm({
          title: !event.target.checked ?
            "Reset Profession Progress" :
            "Complete Profession",
          content: !event.target.checked ?
            "<p>Do you really want to reset your progress in this profession?</p>" :
            "<p>Do you really want to purchase all advances in this profession? The current purchase state will be lost!</p>",
          yes: () => ZweihanderProfession.toggleProfessionPurchases(item, !event.target.checked),
          defaultYes: false
        });
      } else if (item.type === "trapping") {
        await item.update({ "data.carried": event.target.checked });
      } else if (item.type === "weapon") {
        await item.update({ "data.equipped": event.target.checked });
      } else if (item.type === "condition" || item.type === "injury" || item.type === "disease" || item.type === "disorder") {
        await item.update({ "data.active": event.target.checked });
      }
    });
    // Show item sheet on right click
    html.find(".fetch-item").contextmenu(event => {
      const target = $(event.currentTarget);
      const skillName = target.text().trim();
      const itemId = actorData.items.find(item => item.name === skillName).id;

      if (itemId) {
        const skillItem = this.actor.items.get(itemId);
        skillItem.sheet.render(true);
      }
    });

    html.find(".item-post").click(async event => {
      const li = $(event.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId")).toObject(false);
      if (item.type === 'weapon' || item.type === 'armor') {
        item.data.qualities = await ZweihanderQuality.getQualities(item.data.qualities.value);
      }
      //console.log(item);
      let html
      try {
        html = await renderTemplate(`systems/zweihander/templates/item-card/item-card-${item.type}.hbs`, item);
      } catch (e) {
        html = await renderTemplate(`systems/zweihander/templates/item-card/item-card-fallback.hbs`, item);
      }
      await ChatMessage.create({ content: html })
    })

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

    // this._damageSheet(html);

    // Update the encumbrance meter
    this._updateEncumbranceMeter(html);

    // Show extra item information on click
    html.find(".js-show-item-description").click(event => this._showItemDescription(event));

    // Roll Skill
    html.find(".skill-roll").click((event) => {
      this._onRollSkill(event, CONFIG.ZWEI.testTypes.skill);
    });

    // Roll Weapon
    html.find(".weapon-roll").click((event) => {
      this._onRollSkill(event, CONFIG.ZWEI.testTypes.weapon)
    });

    // Roll Spell
    html.find(".spell-roll").click((event) => {
      this._onRollSkill(event, CONFIG.ZWEI.testTypes.spell)
    });

    // Roll Dodge
    html.find(".dodge-roll").click((event) => {
      this._onRollSkill(event, CONFIG.ZWEI.testTypes.dodge);
    });

    // Roll Parry
    html.find(".parry-roll").click((event) => {
      this._onRollSkill(event, CONFIG.ZWEI.testTypes.parry);
    });

    html.find(".js-display-quality").contextmenu(async (event) => {
      event.preventDefault();
      const target = $(event.currentTarget);
      const qualityName = target.text();
      const quality = await ZweihanderUtils.findItemWorldWide("quality", qualityName);
      quality.sheet.render(true);
    });

    html.find(".peril-rolls .image-container").click(async (event) => {
      const perilType = ZweihanderDice.PERIL_ROLL_TYPES[event.currentTarget.dataset.perilType.toUpperCase()];
      ZweihanderDice.rollPeril(perilType, this.actor);
    })
  }

  async _onRollSkill(event, testType) {
    event.preventDefault();
    const element = event.currentTarget;
    const skill = element.dataset.label;
    const skillItem = this.actor.items.find(item => item.type === 'skill' && ZweihanderUtils.normalizedEquals(item.name, skill));
    if (skillItem) {
      const additionalConfiguration = {};
      if (testType === 'weapon' || testType === 'spell') {
        additionalConfiguration[`${testType}Id`] = $(element).parents(".item").data('itemId');
      }
      await ZweihanderDice.rollTest(skillItem, testType, additionalConfiguration, { showDialog: true });
    } else {
      ui.notifications.error(`Associated Skill "${skill}" does not exist for this actor!`);
    }
  }

  _showItemDescription(event) {
    event.preventDefault();
    const toggler = $(event.currentTarget);
    const item = toggler.parents(".item");
    const description = item.find(".item-summary");

    $(description).slideToggle(function () {
      $(this).toggleClass("open");
    });
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
