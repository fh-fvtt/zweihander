import ZweihanderActorConfig from "../../apps/actor-config";
import * as ZweihanderDice from "../../dice";
import ZweihanderQuality from "../../item/entity/quality";
import * as ZweihanderUtils from "../../utils";
import ZweihanderBaseActorSheet from "./base-actor-sheet";
/**
 * The Zweihänder actor sheet class for characters.
 * @extends {ActorSheet}
 */
export default class ZweihanderActorSheet extends ZweihanderBaseActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["zweihander", "sheet", "character"],
      template: "systems/zweihander/templates/pc/main.hbs",
      width: 750,
      height: 900,
      resizable: true,
      tabs: [
        { navSelector: ".sheet-navigation", contentSelector: ".sheet-body", initial: "main" }
      ],
      scrollY: ['.save-scroll']
    });
  }
  
  /** @override */
  getData() {
    const data = super.getData();

    data.data.owner = this.actor.isOwner;
    data.data.editable = this.isEditable;
    data.data.rollData = this.actor.getRollData.bind(this.actor);

    if (this.actor.data.type === "character") {
      data.data.rankOptions = { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9" };
      data.data.perilOptions = { 5: "Unhindered", 4: "Imperiled", 3: "Ignore 1 Skill Rank", 2: "Ignore 2 Skill Ranks", 1: "Ignore 3 Skill Ranks", 0: "INCAPACITATED!" };
      data.data.damageOptions = { 5: "Unharmed", 4: "Lightly Wounded", 3: "Moderately Wounded", 2: "Seriously Wounded", 1: "Grievously Wounded", 0: "SLAIN!" };
    }
    const addSource = (items) => items.map(i => ({
      ...i,
      source: i.flags.zweihander?.source?.label ?? 'Manual',
      isManualSource: i.flags.zweihander?.source?.label ? false : true 
    }));

    const sortSort = (a, b) => (a.sort || 0) - (b.sort || 0);
    data.data.skills = this.actor.data.skills;
    data.data.professions = this.actor.data.professions;
    data.data.spells = this.actor.data.spells.sort(sortSort);
    data.data.weapons = this.actor.data.weapons.sort(sortSort);
    data.data.armor = this.actor.data.armor.sort(sortSort);
    data.data.trappings = this.actor.data.trappings.sort(sortSort);
    data.data.rituals = this.actor.data.rituals.sort(sortSort);
    data.data.ancestry = this.actor.data.ancestry;
    data.data.drawbacks = addSource(this.actor.data.drawbacks);
    data.data.injuries = this.actor.data.injuries.sort(sortSort);
    data.data.diseases = this.actor.data.diseases.sort(sortSort);
    data.data.disorders = this.actor.data.disorders.sort(sortSort);
    data.data.conditions = this.actor.data.conditions.sort(sortSort);
    data.data.uniqueAdvances = this.actor.data.uniqueAdvances.sort(sortSort);
    data.data.bio = this.actor.data.data.flavor.description;
    data.data.traits = addSource(this.actor.data.traits.sort(sortSort));
    const purchasedTalents = this.actor.data.professions.flatMap(p =>
      p.data.talents
        .filter(t => t.purchased && t.linkedId)
        .map(t => this.actor.items.get(t.linkedId)?.toObject(false))
    );
    data.data.talents = addSource(purchasedTalents.sort(sortSort));

    let flags = ZweihanderActorConfig.getConfig(this.actor.data);
    data.data.damageThresholdAttribute = flags.dthAttribute;
    data.data.perilThresholdAttribute = flags.pthAttribute;

    data.data.initiativeAttribute = flags.intAttribute;
    data.data.movementAttribute = flags.movAttribute;

    data.data.parrySkills = flags.parrySkills;
    data.data.dodgeSkills = flags.dodgeSkills;
    data.data.magickSkills = flags.magickSkills;

    data.data.isMagickUser = flags.isMagickUser;

    data.data.permanentChaosRanks = flags.permanentChaosRanks;

    data.data.perilLadder = flags.perilLadder;

    return data.data;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const trackRewardPointsOn = game.settings.get("zweihander", "trackRewardPoints");
    const actor = this.actor;
    const actorData = this.actor.data;

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

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

    // Edit Ancestry Item
    html.find('.ancestry-edit-button').click(() => {
      const ancestryId = this.actor.data.ancestry[0]._id;
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
      const ancestryId = this.actor.data.ancestry[0]._id;

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
        await item.update({ "data.tier.completed": event.target.checked });
      } else if (item.type === "trapping") {
        await item.update({ "data.carried": event.target.checked });
      } else if (item.type === "weapon") {
        await item.update({ "data.equipped": event.target.checked });
      } else if (item.type === "condition" || item.type === "injury" || item.type === "disease" || item.type === "disorder") {
        await item.update({ "data.active": event.target.checked });
      }
    });

    // Update the value of the Damage Threshold label depending on armor worn
    this._updateDamageThresholdLabel(html);

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

    this._damageSheet(html);

    this._perilSheet(html);

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

  _damageSheet(html) {
    if (Number(this.actor.data.data.stats.secondaryAttributes.damageCurrent.value) < 5) {
      html.find('.bloodstain-1').toggleClass('bloodstain-inactive')
    }
    if (Number(this.actor.data.data.stats.secondaryAttributes.damageCurrent.value) < 4) {
      html.find('.bloodstain-2').toggleClass('bloodstain-inactive')
    }
    if (Number(this.actor.data.data.stats.secondaryAttributes.damageCurrent.value) < 3) {
      html.find('.bloodstain-3').toggleClass('bloodstain-inactive')
    }
    if (Number(this.actor.data.data.stats.secondaryAttributes.damageCurrent.value) < 2) {
      html.find('.bloodstain-4').toggleClass('bloodstain-inactive')
    }
    if (Number(this.actor.data.data.stats.secondaryAttributes.damageCurrent.value) < 1) {
      html.find('.bloodstain-5').toggleClass('bloodstain-inactive')
    }
  }

  _perilSheet(html) {
    if (Number(this.actor.data.data.stats.secondaryAttributes.perilCurrent.value) < 5) {
      html.find('.profile-image').addClass('peril1')
    }
    if (Number(this.actor.data.data.stats.secondaryAttributes.perilCurrent.value) < 4) {
      html.find('.profile-image').addClass('peril2')
    }
    if (Number(this.actor.data.data.stats.secondaryAttributes.perilCurrent.value) < 3) {
      html.find('.profile-image').addClass('peril3')
    }
    if (Number(this.actor.data.data.stats.secondaryAttributes.perilCurrent.value) < 2) {
      html.find('.profile-image').addClass('peril4')
    }
    if (Number(this.actor.data.data.stats.secondaryAttributes.perilCurrent.value) < 1) {
      html.find('.profile-image').addClass('peril5')
    }
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
      await ZweihanderDice.rollTest(skillItem, testType, additionalConfiguration, {showDialog: true});
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

  _updateDamageThresholdLabel(html) {
    const dtmLabel = html.find('.label.dtm').text();
    const contents = dtmLabel.split("+");
    const armor = this.actor.items.find(item => item.type === "armor" && item.data.data.equipped == true);

    if (armor !== null && armor !== undefined) {
      const dtm = armor.data.data.damageThresholdModifier.value;
      html.find('.label.dtm').text(contents[0] + "+" + dtm);
    }
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

  /* -------------------------------------------- */

  /** @override */
  async _render(force = false, options = {}) {
    const toIterate = [
      "professions",
      "drawbacks",
      "weapons",
      "armor",
      "trappings",
      "talents-and-traits",
      "unique-advances",
      "spells",
      "rituals",
      "conditions",
      "injuries",
      "diseases",
      "disorders"
    ];

    this._saveToggleStates(toIterate);
    await super._render(force, options);
    this._setToggleStates(toIterate);
  }

  _saveToggleStates(toIterate) {
    if (this.form === null)
      return;

    const html = $(this.form).parent();

    this.toggleStates = {};

    for (let item of toIterate) {
      let elements = $(html.find(`.save-toggle-${item}`));

      this.toggleStates[item] = [];

      for (let element of elements) {
        const isOpen = $(element).hasClass("open");

        this.toggleStates[item].push(isOpen);
      }
    }
  }

  _setToggleStates(toIterate) {
    if (this.toggleStates) {
      const html = $(this.form).parent();

      for (let item of toIterate) {
        if (!this.toggleStates[item].length)
          continue;

        let elements = $(html.find(`.save-toggle-${item}`));

        for (let i = 0; i < elements.length; i++) {
          if (this.toggleStates[item][i]) {
            $(elements[i]).show().addClass("open");
          }
        }
      }
    }
  }
}
