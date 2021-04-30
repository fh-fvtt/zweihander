/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
 export class ZweihanderNpcSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["zweihander", "sheet", "npc"],
        template: "systems/zweihander/templates/actor/npc-sheet.html",
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
  
      return data.data;
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    activateListeners(html) {
      super.activateListeners(html);
  
      let actorData = this.actor.data;
  
      // Everything below here is only needed if the sheet is editable
      if (!this.options.editable) return;
  
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    async _updateObject(event, formData) {
  
      // Handle the free-form attributes list
      console.log("NPC TEST formData :::: ", formData);
      console.log("NPC TEST expandObject(formData) :::: ", expandObject(formData));
      console.log("NPC TEST expandObject(formData).data :::: ", expandObject(formData).data);
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
  