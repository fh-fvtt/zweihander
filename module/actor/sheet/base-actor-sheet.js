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

}