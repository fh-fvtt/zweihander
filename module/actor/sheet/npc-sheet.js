import ZweihanderBaseActorSheet from "./base-actor-sheet";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
 export default class ZweihanderNpcSheet extends ZweihanderBaseActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["zweihander", "sheet", "npc"],
      template: "systems/zweihander/templates/actor/npc-sheet.hbs",
      width: 689, //720,
      height: 890, //945,
      resizable: false,
      tabs: [],
      scrollY: []
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    data.data.skills = this.actor.data.skills;
    data.data.spells = this.actor.data.spells;
    data.data.weapons = this.actor.data.weapons;
    data.data.trappings = this.actor.data.trappings;
    data.data.talents = this.actor.data.talents;
    data.data.traits = this.actor.data.traits;
    data.data.rituals = this.actor.data.rituals;
    data.data.ancestry = this.actor.data.ancestry;
    data.data.injuries = this.actor.data.injuries;
    data.data.conditions = this.actor.data.conditions;

    //console.log(this.actor)

    return data.data;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    let actorData = this.actor.data;

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add new Item (from within the sheet)
    html.find('.add-new').click(async ev => {
      let type = ev.currentTarget.dataset.itemType;

      if (type === "talentTrait") {
        // TODO: add Dialog to choose
        //console.log("TODO: allow user to choose between Talent and Trait");
        return;
      }

      const createdItemArray = await this.actor.createEmbeddedDocuments("Item", [ 
        { "type": type, "name": type } 
      ]);

      createdItemArray[0].sheet.render(true);
    });

    // Edit Ancestry Item
    html.find('.ancestry-edit-button').click(ev => {
      const ancestryId = this.actor.data.ancestry[0]._id;
      const ancestryItem = this.actor.items.get(ancestryId);

      ancestryItem.sheet.render(true);
    });

    // Delete Ancestry Item
    html.find('.ancestry-delete-button').click(async ev => {
      const ancestryId = this.actor.data.ancestry[0]._id;

      await this.actor.deleteEmbeddedDocuments("Item", [ ancestryId ]);
    });

    // Show Item sheet on right-click
    html.find('.fetch-skill').contextmenu(ev => {
      const target = $(ev.currentTarget);
      const skillName = target.text().trim().split("+")[0];
      const itemId = this.actor.data.skills.find(skill => skill.name === skillName)._id;

      if (itemId) {
        const skillItem = this.actor.items.get(itemId);
        skillItem.sheet.render(true);
      }
    });

    // Edit Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(async ev => {
      const li = $(ev.currentTarget).parents(".item");
      const itemName = li.children(".image-and-name").children("span").text();

      await Dialog.confirm({
        title: `Delete Embedded Item: ${itemName}`,
        content: "<p>Are you sure?</p><p>This item will be permanently deleted and cannot be recovered.</p>",
        yes: async () => {
          await this.actor.deleteEmbeddedDocuments("Item", [ li.data("itemId") ]);
          li.slideUp(200, () => this.render(false));
        },
        no: () => {},
        defaultYes: false
      });
    });

    // Fill Damage and Peril Thresholds
    this._setThresholds(html);

    // Alternate color for lists
    this._alternateRowColor(html);
  }

  _setThresholds(html) {
    const perilArray = Object.keys(this.actor.data.data.stats.secondaryAttributes.perilThreshold);
    const damageArray = Object.keys(this.actor.data.data.stats.secondaryAttributes.damageThreshold);

    let derivedPeril = "";

    for (let i = 1; i < perilArray.length; i++) {
      derivedPeril += "" + this.actor.data.data.stats.secondaryAttributes.perilThreshold[perilArray[i]];

      if (i !== perilArray.length - 1) {
        derivedPeril += "/";
      }
    }

    let derivedDamage = "";

    for (let i = 1; i < damageArray.length; i++) {
      derivedDamage += "" + this.actor.data.data.stats.secondaryAttributes.damageThreshold[damageArray[i]];

      if (i !== damageArray.length - 1) {
        derivedDamage += "/";
      }
    }

    html.find('.derived.peril').text(derivedPeril);
    html.find('.derived.damage').text(derivedDamage);
  }

  _alternateRowColor(html) {
    html.find(".even").css("background", "var(--zh-clr-bright1)");
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {

    // Handle the free-form attributes list
    //console.log("NPC TEST formData :::: ", formData);
    //console.log("NPC TEST expandObject(formData) :::: ", expandObject(formData));
    //console.log("NPC TEST expandObject(formData).data :::: ", expandObject(formData).data);
    /*const formAttrs = expandObject(formData).data.attributes || {};
    const attributes = Object.values(formAttrs).reduce((obj, v) => {
      let k = v["key"].trim();
      if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
      delete v["key"];
      obj[k] = v;
      return obj;
    }, {});
    
    // Remove attributes which are no longer used
    for ( let k of Object.keys(this.object.data.data.attributes) ) {
      if ( !attributes.hasOwnProperty(k) ) attributes[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("data.attributes")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: this.object._id, "data.attributes": attributes});
    */
    // Update the Actor
    return await this.object.update(formData);
  }
}
  