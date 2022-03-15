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
    await super._render(force, options);
    // restore toggle states for item details
    toggleStates.forEach(id => 
      $(this.form).find(`[data-item-id="${id}"] .save-toggle`).show().addClass("open")
    );
  }

  activateListeners(html) {
    super.activateListeners(html);
    this._damageSheet(html);
    this._perilSheet(html);
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
        const lastW = i === 0 ? 0 : breakpoints[i-1].width;
        const nextW = i === breakpoints.length - 1 ? Number.POSITIVE_INFINITY : breakpoints[i+1].width;
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
    listener.each(function() {
      $(this.contentWindow).resize(onWidthChange);
      onWidthChange.bind(this.contentWindow)();
    });
  }

}