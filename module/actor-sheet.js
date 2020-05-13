/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ZweihanderActorSheet extends ActorSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
  	  classes: ["zweihander", "sheet", "actor"],
  	  template: "systems/zweihander/templates/actor-sheet.html",
      width: 720,
      height: 945,
      resizable: false,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main"}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    /*for ( let attr of Object.values(data.data.attributes) ) {
      attr.isCheckbox = attr.dtype === "Boolean";
    }*/
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    // html.find('.item-edit').click(ev => {
    //   const li = $(ev.currentTarget).parents(".item");
    //   const item = this.actor.getOwnedItem(li.data("itemId"));
    //   item.sheet.render(true);
    // });

    // Delete Inventory Item
    // html.find('.item-delete').click(ev => {
    //   const li = $(ev.currentTarget).parents(".item");
    //   this.actor.deleteOwnedItem(li.data("itemId"));
    //   li.slideUp(200, () => this.render(false));
    // });

    // Add or Remove Attribute
    //html.find(".attributes").on("click", ".attribute-control", this._onClickAttributeControl.bind(this));


    // On loss of focus, update the textbox value

    html.find(".notepad").focusout(event => {
      this.actor.update({"data.flavor.notes": event.target.value});
    });

    html.find(".encumbrance-current").change(event => {
      const data = this.actor.data.data;
      const inputValue = event.target.value;
      const ratio = (inputValue / data.stats.secondaryAttributes.encumbrance.value) * 100;

      $(".meter-label").text(inputValue + " / " + data.stats.secondaryAttributes.encumbrance.value);
      $(".meter-value").width(ratio + "%");
    });
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options={}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events on an attribute control to modify the composition of attributes in the sheet
   * @param {MouseEvent} event    The originating left click event
   * @private
   */
  async _onClickAttributeControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    const attrs = this.object.data.data.attributes;
    const form = this.form;

    // Add new attribute
    if ( action === "create" ) {
      const nk = Object.keys(attrs).length + 1;
      let newKey = document.createElement("div");
      newKey.innerHTML = `<input type="text" name="data.attributes.attr${nk}.key" value="attr${nk}"/>`;
      newKey = newKey.children[0];
      form.appendChild(newKey);
      await this._onSubmit(event);
    }

    // Remove existing attribute
    else if ( action === "delete" ) {
      const li = a.closest(".attribute");
      li.parentElement.removeChild(li);
      await this._onSubmit(event);
    }
  }

  
  async _render(force = false, options = {}) {
    this._saveScrollPos();

    await super._render(force, options);
    
    this._setScrollPos();
  }

  _saveScrollPos() {
    if (this.form === null)
      return;

    const html = $(this.form).parent();

    this.scrollPos = [];

    let lists = $(html.find(".save-scroll"));

    for (let list of lists) {
      this.scrollPos.push($(list).scrollTop());
    }
  }

  _setScrollPos() {
    if (this.scrollPos) {
      const html = $(this.form).parent();

      let lists = $(html.find(".save-scroll"));

      for (let i = 0; i < lists.length; i++) {
        $(lists[i]).scrollTop(this.scrollPos[i]);
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {

    // Handle the free-form attributes list
    console.log("TEST formData :::: ", formData);
    console.log("TEST expandObject(formData) :::: ", expandObject(formData));
    console.log("TEST expandObject(formData).data :::: ", expandObject(formData).data);
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
    return this.object.update(formData);
  }
}
