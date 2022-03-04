export default class ZweihanderBaseActorSheet extends ActorSheet {

  static unsupportedItemTypes = new Set([
    'quality',
    'skill'
  ]);

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

}