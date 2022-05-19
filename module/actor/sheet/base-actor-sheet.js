import * as ZweihanderDice from "../../dice";
import * as ZweihanderUtils from "../../utils";
import ZweihanderProfession from "../../item/entity/profession";
import ZweihanderQuality from "../../item/entity/quality";
import ZweihanderLanguageConfig from "../../apps/language-config";
import ZweihanderActorConfig from "../../apps/actor-config";

export default class ZweihanderBaseActorSheet extends ActorSheet {

  static get defaultOptions() {
    const compactMode = game.settings.get("zweihander", "openInCompactMode");
    const classes = ["zweihander", "sheet", "actor", "damage-tracker"];
    if (compactMode) {
      classes.push("zweihander-compact-sheet");
    }
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes,
      resizable: true,
    });
  }

  #languageConfig;
  #actorConfig;
  sortCriteria = {};
  filterCriteria = {};

  constructor(...args) {
    super(...args);
    this.#languageConfig = new ZweihanderLanguageConfig(this.actor);
    this.#actorConfig = new ZweihanderActorConfig(this.actor);
  }

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
      config: CONFIG.ZWEI,
      rollData: this.actor.getRollData.bind(this.actor),
      settings: {}
    };

    // The Actor's data
    const actorData = this.actor.data.toObject(false);
    data.actor = actorData;
    data.data = actorData.data;

    // Owned Items
    data.items = actorData.items;
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Prepare owned items
    this._prepareItems(data);

    data.effects = actorData.effects;

    const itemGroups = this._processItemGroups(this._getItemGroups(data));
    data.itemGroups = ZweihanderUtils.assignPacks(this.actor.type, itemGroups);
    
    // Prepare active effects
    // data.effects = ActiveEffect5e.prepareActiveEffectCategories(this.actor.effects);

    // Prepare warnings
    // data.warnings = this.actor._preparationWarnings;

    // Return data to the sheet
    return data;
  }

  _prepareItems() {

  }

  _getItemGroups() {

  }

  _processItemGroups(itemGroups) {
    const sort = (itemGroup, criteria) => itemGroup.items.sort((a, b) => {
      for (let sc of criteria) {
        let aV, bV;
        if (sc.detail === -1) {
          aV = a.name;
          bV = b.name
        } else if (itemGroup.details[sc.detail].key) {
          aV = getProperty(a, itemGroup.details[sc.detail].key);
          bV = getProperty(b, itemGroup.details[sc.detail].key);
        } else {
          aV = itemGroup.details[sc.detail].value.call(a);
          bV = itemGroup.details[sc.detail].value.call(b);
        }
        if (aV < bV) {
          return sc.sort;
        } else if (aV > bV) {
          return -sc.sort;
        }
      }
      return 0;
    });
    const filter = (itemGroup, criteria) =>
      itemGroup.items = itemGroup.items.filter((i) => {
        let filtered = true;
        for (let fc of criteria) {
          let v;
          if (fc.detail === -1) {
            v = i.name;
          } else if (itemGroup.details[fc.detail].key) {
            v = getProperty(i, itemGroup.details[fc.detail].key);
          } else {
            v = itemGroup.details[fc.detail].value.call(i);
          }
          // only strings supported for now
          if (typeof v === 'string') {
            filtered = filtered && v.trim().toLowerCase().indexOf(fc.value.trim().toLowerCase()) >= 0;
          }
        }
        return filtered;
      });
    for (let [k, v] of Object.entries(this.sortCriteria)) {
      sort(itemGroups[k], v.filter(c => !!c.sort));
      for (let [i, sc] of v.entries()) {
        if (sc.detail === -1) {
          itemGroups[k].sortName = sc.sort;
          itemGroups[k].sortNameOrder = i+1;
        } else {
          itemGroups[k].details[sc.detail].sort = sc.sort;
          itemGroups[k].details[sc.detail].sortOrder = i+1;          
        }
      }
    }
    for (let [k, v] of Object.entries(this.filterCriteria)) {
      filter(itemGroups[k], v.filter(c => !!c.value));
      for (let fc of v) {
        if (fc.detail === -1) {
          itemGroups[k].filterName = fc.value;
          itemGroups[k].filterNameActive = !!fc.active;
        } else {
          itemGroups[k].details[fc.detail].filter = fc.value;
          itemGroups[k].details[fc.detail].filterActive = !!fc.active;
        }
      }
    }
    Object.entries(itemGroups).forEach(([k,v]) => v.id = k);
    return itemGroups;
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
    html.find('.modded-value-indicator').hover((event) => {
      const tooltip = $(event.currentTarget).find('.modded-value-tooltip').clone();
      const offset = $(event.currentTarget).offset();
      offset.top += 25;
      offset.left -= (200 / 2) - 8;
      tooltip.addClass('zh-modded-value-tooltip-instance');
      tooltip.offset(offset);
      $('body').append(tooltip);
    },
      (event) => {
        $('.zh-modded-value-tooltip-instance').remove();
      })
    // auto size the details inputs once
    const autoSizeInput = (el) => el.attr('size', Math.max(el.attr('placeholder').length, el.val().length));
    const inputsToAutoSize = html.find('input.auto-size');
    inputsToAutoSize.each((i, x) => autoSizeInput($(x)));

    const getItemGroupCriteria = (criteria, itemGroupKey) => {
      if (!criteria[itemGroupKey]) {
        criteria[itemGroupKey] = [];
      }
      return criteria[itemGroupKey];
    }

    const getCriterion = (criteria, itemGroupKey, detail, create=true) => {
      const itemGroupCriteria = getItemGroupCriteria(criteria, itemGroupKey);
      const existingCriterion = itemGroupCriteria.find(c => c.detail === detail);
      if (!existingCriterion && create) {
        const criterion = { detail };
        itemGroupCriteria.push(criterion);
        return criterion;
      }
      return existingCriterion;
    }

    html.find('.show-filter').click((event) => {
      event.stopPropagation();
      const el = $(event.currentTarget).parents('.filterable');
      const itemGroup = el.data('itemGroup');
      const detail = Number.parseInt(el.data('detail'));
      getCriterion(this.filterCriteria, itemGroup, detail).active = true;
      el.find('.filter-input').addClass('filter-input-active');
      el.find('.filter-input input').focus();
    })
    html.find('.hide-filter').click((event) => {
      event.stopPropagation();
      const el = $(event.currentTarget).parents('.filterable');
      const itemGroup = el.data('itemGroup');
      const detail = Number.parseInt(el.data('detail'));
      $(event.currentTarget).parents('.filter-input').removeClass('filter-input-active');
      getCriterion(this.filterCriteria, itemGroup, detail).active = false;
    })
    html.find('.filter-input input').click((event) => event.stopPropagation());
    html.find('.filter-input input').keydown((event) => {
      event.stopPropagation();
      const el = $(event.currentTarget).parents('.filterable');
      const itemGroup = el.data('itemGroup');
      const detail = Number.parseInt(el.data('detail'));
      if (event.keyCode === 27) {
        $(event.currentTarget).parent().removeClass('filter-input-active');
        getCriterion(this.filterCriteria, itemGroup, detail).active = false;
      } else if (event.keyCode === 13) {
        const criterion = getCriterion(this.filterCriteria, itemGroup, detail);
        criterion.value = event.currentTarget.value;
        if (criterion.value.trim() === '') {
          $(event.currentTarget).parent().removeClass('filter-input-active');
          criterion.active = false;
        }
        this.render();
      }
    });
    html.find('.sortable').click((event) => {
      event.stopPropagation();
      const el = $(event.currentTarget);
      const itemGroup = el.data('itemGroup');
      const detail = Number.parseInt(el.data('detail'));
      const criterion = getCriterion(this.sortCriteria, itemGroup, detail);
      if (!criterion.sort) {
        criterion.sort = 1;
      } else if (criterion.sort === 1) {
        criterion.sort = -1;
      } else if (criterion.sort === -1) {
        criterion.sort = 0;
        const ig = this.sortCriteria[itemGroup];
        ig.splice(ig.indexOf(criterion), 1);
      }
      this.render();
    });
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    // auto size the details inputs on change
    inputsToAutoSize.bind('input', (event) => autoSizeInput($(event.currentTarget)));

    const actor = this.actor;
    const actorData = this.actor.data;
    // Edit Inventory Item
    html.find('.item-edit').click(ev => {
      const i = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(i.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(async ev => {
      const i = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(i.data("itemId"));
      const type = game.i18n.localize(CONFIG.Item.typeLabels[item.type]);
      await Dialog.confirm({
        title: `Delete Embedded ${type}: ${item.name}`,
        content: `<h4>Are you sure?</h4><p>This ${type} will be permanently deleted and cannot be recovered.</p>`,
        yes: async () => {
          await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
          i.slideUp(200, () => this.render(false));
        },
        no: () => { },
        defaultYes: true
      });
    });

    // Edit Active Effect
    html.find('.effect-edit').click(ev => {
      const i = $(ev.currentTarget).parents(".item");
      const item = this.actor.effects.get(i.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Active Effect
    html.find('.effect-delete').click(async ev => {
      const i = $(ev.currentTarget).parents(".item");
      const effect = this.actor.effects.get(i.data("itemId"));
      const type = game.i18n.localize(CONFIG.ActiveEffect.typeLabels["base"]);
      await Dialog.confirm({
        title: `Delete ${type}: ${effect.data.label}`,
        content: `<h4>Are you sure?</h4><p>This ${type} will be permanently deleted and cannot be recovered.</p>`,
        yes: async () => {
          await this.actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
          i.slideUp(200, () => this.render(false));
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
    });

    // Add new Item (from within the sheet)
    html.find('.add-new').click(async ev => {
      let type = ev.currentTarget.dataset.itemType;

      let createdItemArray = [];

      if (type !== 'effect') {
        createdItemArray = await this.actor.createEmbeddedDocuments("Item", [
          { "type": type, "name": type }
        ]);
      } else {
        createdItemArray = await this.actor.createEmbeddedDocuments("ActiveEffect", [
          {
            "label": "New Effect",
            "icon": "systems/zweihander/assets/icons/dice-fire.svg",
            "origin": this.actor.id
          }
        ]);
      }

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

    html.find('.inline-roll').each(async function () {
      const formula = $(this).text().trim().split('+');
      const diceRoll = formula[0];
      const dataPath = formula[1];

      if (dataPath && dataPath.includes('@')) 
        $(this).html('<i class="fas fa-dice-d20"></i> ' + diceRoll + '+' + await ZweihanderUtils.parseDataPaths(dataPath, actor));
    });

    // "Link" checkboxes on character sheet and item sheet so both have the same state
    html.find(".link-checkbox").click(async event => {
      event.preventDefault();
      const checkbox = $(event.currentTarget);
      const item = this.actor.items.get(checkbox.data('itemId'));
      const key = checkbox.data('key');
      await item.update({ [key]: checkbox.prop('checked') });
    });
    // "Link" checkboxes on character sheet and active effect sheet so both have the same state
    html.find(".link-effect-checkbox").click(async event => {
      event.preventDefault();
      const checkbox = $(event.currentTarget);
      const item = this.actor.effects.get(checkbox.data('itemId'));
      const key = checkbox.data('key');
      await item.update({ [key]: checkbox.prop('checked') });
    });
    html.find(".profession-checkbox").click(async event => {
      event.preventDefault();
      const checkbox = $(event.currentTarget);
      const item = this.actor.items.get(checkbox.data('itemId'));
      if (!event.currentTarget.checked && item.data.data.tier !== item.actor.data.data.tier) {
        ui.notifications.error(`In order to reset this professions progress you have to delete the profession above it first!`);
        return;
      }
      Dialog.confirm({
        title: !event.currentTarget.checked ?
          `Reset Profession Progress: ${item.name}` :
          `Complete Profession Progress: ${item.name}`,
        content: !event.currentTarget.checked ?
          `<h4>Reset Profession progress?</h4>` :
          `<h4>Purchase all Profession advances?</h4><p>Current purchase state will be lost!</p>`,
        yes: () => ZweihanderProfession.toggleProfessionPurchases(item, !event.currentTarget.checked),
        defaultYes: false
      });
    });
    // Show item sheet on right click
    html.find(".fetch-item").contextmenu(event => {
      const itemId = $(event.currentTarget).parent('.item').data('itemId') ?? $(event.currentTarget).data('itemId');
      const item = this.actor.items.get(itemId);
      item.sheet.render(true);
    });

    // Show effect sheet on right click
    html.find(".fetch-effect").contextmenu(event => {
      const itemId = $(event.currentTarget).parent('.item').data('itemId') ?? $(event.currentTarget).data('itemId');
      const effect = this.actor.effects.get(itemId);
      effect.sheet.render(true);
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

    html.find(".open-language-config").click(() => this.#languageConfig.render(true));
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

  _registerDimensionChangeListener(el, cb) {
    // this magic changes the pattern of the skills list when it resizes beyond the column breakpoint.
    // sadly, this is currently not possible with pure css.
    el.prepend('<iframe class="dimension-change-listener" tabindex="-1"></iframe>');
    const listener = el.find(`.dimension-change-listener`);
    listener.each(function () {
      $(this.contentWindow).resize(cb);
      cb.bind(this.contentWindow)();
    });
  }

  _getDimensionBreakpointsCallback(dimension, breakpoints) {
    let y = -1;
    return function () {
      const x = this[dimension];
      for (let [i, bp] of breakpoints.entries()) {
        const lastAt = i === 0 ? 0 : breakpoints[i - 1].at;
        const nextAt = i === breakpoints.length - 1 ? Number.POSITIVE_INFINITY : breakpoints[i + 1].at;
        if (x > lastAt && x < nextAt && (y === -1 || (y > lastAt && y < nextAt))) {
          if (x >= bp.at && y < bp.at) {
            bp.callback(true);
          } else if (x < bp.at && y >= bp.at) {
            bp.callback(false);
          }
        }
      }
      y = x;
    }
  }

  async _onRollSkill(event, testType) {
    event.stopImmediatePropagation();
    event.stopPropagation();
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
    const toggler = $(event.currentTarget);
    const item = toggler.parents(".item");
    const description = item.find(".item-summary");

    $(description).slideToggle(function () {
      $(this).toggleClass("open");
    });
  }

  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    if (game.user.isGM || !this.actor.limited) {
      const compactMode = game.settings.get("zweihander", "openInCompactMode");
      buttons.splice(0, 0, {
        label: ' Compact Mode',
        class: 'hide-background',
        icon: `hide-background-toggle fas fa-toggle-${compactMode ? "on" : "off"}`,
        onclick: (event) => {
          const sheet = $(event.currentTarget).parents('.sheet');
          sheet.toggleClass('zweihander-compact-sheet');
          $(event.currentTarget).find('.hide-background-toggle')
            .toggleClass('fa-toggle-on')
            .toggleClass('fa-toggle-off');
        }
      });
    }
    if (this.options.editable && (game.user.isGM || this.actor.isOwner)) {
      buttons.splice(1, 0, {
        label: 'Actor',
        class: 'configure-actor',
        icon: 'fas fa-user-cog',
        onclick: () => this.#actorConfig.render(true)
      });
    }
    return buttons;
  }

}