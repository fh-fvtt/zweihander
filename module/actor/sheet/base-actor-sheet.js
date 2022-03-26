import * as ZweihanderDice from "../../dice";
import * as ZweihanderUtils from "../../utils";
import ZweihanderProfession from "../../item/entity/profession";
import ZweihanderQuality from "../../item/entity/quality";

export default class ZweihanderBaseActorSheet extends ActorSheet {

  /** @override */
  getData(options) {
    // Basic data
    let isOwner = this.actor.isOwner;
    const data = {
      owner: isOwner,
      limited: this.actor.limited,
      options: this.options,
      editable: this.isEditable,
      cssClass: isOwner ? "editable" : "locked",
      isCharacter: this.actor.type === "character",
      isNPC: this.actor.type === "npc",
      isCreature: this.actor.type === "creature",
      config: CONFIG.DND5E,
      rollData: this.actor.getRollData.bind(this.actor)
    };

    // The Actor's data
    const actorData = this.actor.data.toObject(false);
    data.actor = actorData;
    data.data = actorData.data;
    data.config = CONFIG.ZWEI;

    // Owned Items
    data.items = actorData.items;
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Prepare owned items
    this._prepareItems(data);

    // Prepare active effects
    // data.effects = ActiveEffect5e.prepareActiveEffectCategories(this.actor.effects);

    // Prepare warnings
    // data.warnings = this.actor._preparationWarnings;

    // Return data to the sheet
    return data;
  }

  _prepareItems() {

  }

  async _onDropItemCreate(itemData) {
    // Check to make sure items of this type are allowed on this actor
    if (this.constructor.unsupportedItemTypes.has(itemData.type)) {
      return ui.notifications.warn(game.i18n.format("ZWEI.ActorWarningInvalidItem", {
        itemType: game.i18n.localize(CONFIG.Item.typeLabels[itemData.type]),
        actorType: game.i18n.localize(CONFIG.Actor.typeLabels[this.actor.type])
      }));
    }
    // Create the owned item as normal
    return super._onDropItemCreate(itemData);
  }

  async _render(force = false, options = {}) {
    // save toggle states for item details
    const toggleStates = $(this.form).find('.save-toggle').toArray()
      .filter((element) => $(element).hasClass("open"))
      .map((element) => $(element).parent().data('itemId'));
    this._saveScrollStates();
    await super._render(force, options);
    // restore toggle states for item details
    toggleStates.forEach(id =>
      $(this.form).find(`[data-item-id="${id}"] .save-toggle`).show().addClass("open")
    );
    this._setScrollStates();
  }

  _saveScrollStates() {
    if (this.form === null)
      return;

    const html = $(this.form).parent();

    this.scrollStates = [];

    let lists = $(html.find(".items-list"));

    for (let list of lists) {
      this.scrollStates.push($(list).scrollTop());
    }
  }

  _setScrollStates() {
    if (this.scrollStates) {
      const html = $(this.form).parent();

      let lists = $(html.find(".items-list"));

      for (let i = 0; i < lists.length; i++) {
        $(lists[i]).scrollTop(this.scrollStates[i]);
      }
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    this._damageSheet(html);
    this._perilSheet(html);

    html.find('.modded-value-indicator').hover(
      (event) => {
        const tooltip = $(event.currentTarget).find('.modded-value-tooltip').clone();
        const offset = $(event.currentTarget).offset();
        offset.top -= 22;
        offset.left += 22;
        tooltip.addClass('zh-modded-value-tooltip-instance');
        tooltip.offset(offset);
        $('body').append(tooltip);
      },
      (event) => {
        $('.zh-modded-value-tooltip-instance').remove();
      })
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    const actor = this.actor;
    const actorData = this.actor.data;
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
      const packIds = ev.currentTarget.dataset.openPacks?.split?.(",")?.filter?.(x => x);
      if (!packIds) {
        ui.notifications.notify(`This item type currently has no system compendium attached!`);
        return
      }
      const packs = packIds.map(x => game.packs.get(x.trim()));
      if (packs.every(x => x?.apps?.[0]?.rendered)) {
        packs.forEach(x => x.apps[0].close());
      }
      packs.forEach((x, i) => x.render(true, {
        top: actor.sheet.position.top,
        left: actor.sheet.position.left + (i % 2 == 0 ? -350 : actor.sheet.position.width)
      }));
    })

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
      const itemId = $(event.currentTarget).parent('.item').data('itemId');
      const skillItem = this.actor.items.get(itemId);
      skillItem.sheet.render(true);
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

  }

  _damageSheet(html) {
    const damage = Number(this.actor.data.data.stats.secondaryAttributes.damageCurrent.value);
    const el = html.parents('.damage-tracker');
    for (let i = 0; i <= 4; i++) {
      if (damage <= i) {
        el.addClass(`damage-tracker-${i}`);
      } else {
        el.removeClass(`damage-tracker-${i}`);
      }
    }
  }

  _perilSheet(html) {
    const peril = Number(this.actor.data.data.stats.secondaryAttributes.perilCurrent.value);
    const el = html.find('.peril-tracker');
    for (let i = peril; i <= 4; i++) {
      el.addClass(`peril-tracker-${i}`);
    }
  }

  _registerWidthListener(html, selector, breakpoints) {
    // this magic changes the pattern of the skills list when it resizes beyond the column breakpoint.
    // sadly, this is currently not possible with pure css.
    let y = -1;
    const el = html.find(selector);
    el.prepend('<iframe class="width-change-listener" tabindex="-1"></iframe>');
    const onWidthChange = function () {
      const x = this.innerWidth;
      for (let [i, bp] of breakpoints.entries()) {
        const lastW = i === 0 ? 0 : breakpoints[i - 1].width;
        const nextW = i === breakpoints.length - 1 ? Number.POSITIVE_INFINITY : breakpoints[i + 1].width;
        if (x > lastW && x < nextW && (y === -1 || (y > lastW && y < nextW))) {
          const w = bp.width;
          if (x >= w && y < w) {
            bp.callback(true);
          } else if (x < w && y >= w) {
            bp.callback(false);
          }
        }
      }
      y = x;
    }
    const listener = html.find(`${selector} .width-change-listener`);
    listener.each(function () {
      $(this.contentWindow).resize(onWidthChange);
      onWidthChange.bind(this.contentWindow)();
    });
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


}