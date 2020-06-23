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
      width: 700, //720,
      height: 925, //945,
      resizable: false,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
      // scrollY: [".save-scroll-skills", ".save-scroll-drawbacks", ".save-scroll-weapons", ".save-scroll-armor", ".save-scroll-magick", ".save-scroll-professions"]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    if (this.actor.data.type === "character") {
      // ...something...
    }

    return data;
  }

  _prepareDamageThreshold(armor, actorData) {
    const data = actorData.data;
    const damageArray = Object.keys(data.stats.secondaryAttributes.damageThreshold);

    for (let i = 0; i < damageArray.length; i++)
      data.stats.secondaryAttributes.damageThreshold[damageArray[i]] += armor.data.damageThresholdModifier.value;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const actorData = this.actor.data;

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");

      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Delete Profession Item
    html.find('.item-delete-profession').click(ev => {
      const li = $(ev.currentTarget).parents(".item");

      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));

      // TODO: REFACTOR -- if another profession of a lower tier contains skill, skip.
      for (let skill of this.actor.data.skills) {
        const keys = Object.keys(skill.data.ranks);

        for (let key of keys) {
          skill.data.ranks[key] = false;
        }

        const updatedSkillData = duplicate(skill.data);

        this.actor.getOwnedItem(skill._id).update(updatedSkillData); // Doesn't work across refresh
      }
    });

    // toFormat.replace(/(@([a-zA-Z0-9]\.)*[a-zA-Z0-9]+)/g, (key) => resolveProperty(actorData, key))

    // Handle formulas for Spell Duration
    html.find('.spell-duration').each(function () {
      const toFormat = $(this).text();

      if (toFormat[0] === "@") {
        const contents = toFormat.split("+");
        const key = contents[0].replace("@", "data.");
        const bonus = getProperty(actorData, key);
        const setDuration = contents[1].split(' ');

        $(this).text((bonus + Number(setDuration[0])) + " " + setDuration[1]);
      }
    });

    // "Link" checkboxes on character sheet and item sheet so both have the same state
    html.find(".link-checkbox").click(event => {
      event.preventDefault();

      console.log("CHECKED: ", event.target.checked);

      const li = $(event.currentTarget).closest(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));

      if (item.type === "armor") {
        item.update({ "data.equipped": event.target.checked });
      } else if (item.type === "profession") {
        item.update({ "data.tier.completed": event.target.checked });
      }
    });

    // Update the value of the Damage Threshold label depending on armor worn
    this._updateDamageThresholdLabel(html);

    // On loss of focus, update the textbox value
    html.find(".notepad").focusout(event => {
      this.actor.update({ "data.flavor.notes": event.target.value });
    });

    // Update the encumbrance meter
    this._updateEncumbranceMeter(html);

    // Show extra item information on click
    html.find(".item-description").click(event => this._showItemDescription(event));

    // TODO: When a profession is deleted, iterate over skills and remove ranks

    // Purchase skill rank
    html.find(".skill-link").click(event => {
      const target = $(event.currentTarget);
      const skillName = target.text().trim();
      const itemId = actorData.items.find(item => item.name === skillName)._id;

      if (itemId) {
        const skillItem = this.actor.getOwnedItem(itemId);
        const skillData = skillItem.data.data;
        if (target.hasClass("not-purchased")) {
          if (!skillData.ranks.apprentice.purchased) {
            skillItem.update({ "data.ranks.apprentice.purchased": true });
          } else if (!skillData.ranks.journeyman.purchased && skillData.ranks.apprentice.purchased) {
            skillItem.update({ "data.ranks.journeyman.purchased": true });
          } else if (!skillData.ranks.master.purchased && skillData.ranks.journeyman.purchased && skillData.ranks.apprentice.purchased) {
            skillItem.update({ "data.ranks.master.purchased": true });
          } else {
            console.log("Unable to purchase additional ranks for this tier.");
          }
        } else {
          if (skillData.ranks.apprentice.purchased && !skillData.ranks.journeyman.purchased && !skillData.ranks.master.purchased) {
            skillItem.update({ "data.ranks.apprentice.purchased": false });
          } else if (skillData.ranks.journeyman.purchased && !skillData.ranks.master.purchased) {
            skillItem.update({ "data.ranks.journeyman.purchased": false });
          } else if (skillData.ranks.master.purchased) {
            skillItem.update({ "data.ranks.master.purchased": false });
          } else {
            console.log("Unable to delete additional ranks for this tier.");
          }
        }

      }
    });

    // Purchase bonus advance
    html.find(".advance-link").click(event => {
      const target = $(event.currentTarget);
      const targetIdx = Number(target.attr("id").split("-")[1]);
      const advanceName = target.text();
      const professionElement = target.closest(".individual-description").siblings(".item");
      const professionItem = this.actor.getOwnedItem($(professionElement).data("itemId"));

      if (professionItem.data.data.tier.value !== "") {
        for (let advance of professionItem.data.data.bonusAdvances.arrayOfValues) {
          if ((advance.name === advanceName) && (advance.index === targetIdx)) {
            advance.purchased = !advance.purchased;
            break;
          }
        }

        const updatedProfessionData = duplicate(professionItem.data);
        const sheet = this;

        professionItem.update(updatedProfessionData).then(function () {
          sheet.render();
        });
      } else {
        console.log("Profession has unspecified Tier:", professionItem.data.name);
      }
    });

    // Show item sheet on right click
    html.find(".fetch-item").contextmenu(event => {
      const target = $(event.currentTarget);
      const skillName = target.text().trim();
      const itemId = actorData.items.find(item => item.name === skillName)._id;

      if (itemId) {
        const skillItem = this.actor.getOwnedItem(itemId);
        skillItem.sheet.render(true);
      }
    });

    // Purchase talent 
    html.find(".talent-link").click(event => {
      const target = $(event.currentTarget);
      const talentName = target.text().trim();
      const itemId = actorData.items.find(item => item.name === talentName)._id;

      if (itemId) {
        const talentItem = this.actor.getOwnedItem(itemId);
        const talentData = talentItem.data.data;

        talentItem.update({ "data.purchased": !talentData.purchased });
      }
    });

    // const parries = ["Simple Melee", "Martial Melee", "Charm", "Incantation", "Guile", ];

    // let parryText = html.find(".parry-skill");

    // html.find(".parry-back").click(event => {
    //   if (parries.indexOf(parryText.text()) == 0) {
    //     html.find(".parry-skill").text(parries[parries.length - 1]);
    //   } else {
    //     html.find(".parry-skill").text(parries[parries.indexOf(parryText.text()) - 1]);
    //   }
    // });

    // html.find(".parry-forward").click(event => {
    //   if (parries.indexOf(parryText.text()) < parries.length - 1) {
    //     html.find(".parry-skill").text(parries[parries.indexOf(parryText.text()) + 1]);
    //   } else {
    //     html.find(".parry-skill").text(parries[0]);
    //   }
    // });

    // Alternate color for lists
    this._alternateRowColor(html);

    // Change sheet layout to compact version
    // html.find(".helmet").click(event => this._changeSheetLayout($(html).parent().parent()));

    // Roll
    html.find(".skill-roll").click(this._onRoll.bind(this));
  }

  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    const skill = $(element).text().toLowerCase();
    const skillItem = this.actor.data.skills[this.actor.data.skills.findIndex(item => item.name.toLowerCase() === skill)];

    if (skillItem) {
      const primaryAttribute = skillItem.data.associatedPrimaryAttribute.value.toLowerCase();
      const rollAgainst = this.actor.data.data.stats.primaryAttributes[primaryAttribute].value;

      let rankBonus = 0;

      if (skillItem.data.ranks.master.purchased) {
        rankBonus = 30;
      } else if (skillItem.data.ranks.journeyman.purchased) {
        rankBonus = 20;
      } else if (skillItem.data.ranks.apprentice.purchased) {
        rankBonus = 10;
      }

      let a = dataset.label;

      console.log(a);

      if (dataset.roll) {
        let roll = new Roll(dataset.roll, this.actor.data.data);
        let label = dataset.label ? `Rolling against ${dataset.label} (${rollAgainst + rankBonus})` : '';

        let b = await renderTemplate("systems/zweihander/templates/item/item-ancestry-sheet.html", {});

        // console.log(b);

        // roll.roll().toMessage({
        //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        //   flavor: label
        // });
      }
    }
  }

  _changeSheetLayout(html) {
    html.css({
      "height": "845px",
      "width": "585px"
    });
    html.find(".sheet-content").css("padding", "15px 10px");
    html.find(".sheet-background").css({ 
      "background-image": "initial",
      "background-size": "initial",
      "background-repeat": "initial",
      "background-color": "white"
    });
  }

  _alternateRowColor(html) {
    html.find(".even").css("background", "rgba(0, 0, 0, 0.05)");
  }

  _showItemDescription(event) {
    event.preventDefault();

    const toggler = $(event.currentTarget);
    const item = toggler.parents(".individual-trapping-and-description");
    const description = item.find(".individual-description");

    $(description).slideToggle(function () {
      $(this).toggleClass("open");
    });
  }

  _updateDamageThresholdLabel(html) {
    const dtmLabel = html.find('.label.dtm').text();
    const contents = dtmLabel.split("+");
    const armor = this.actor.items.find(item => item.type === "armor" && item.data.data.equipped == true);

    if (armor !== null) {
      const dtm = armor.data.data.damageThresholdModifier.value;
      html.find('.label.dtm').text(contents[0] + "+" + dtm);
    }
  }

  _updateEncumbranceMeter(html) {
    const currentEncumbrance = html.find(".encumbrance-current").val();
    const totalEncumbrance = html.find(".encumbrance-total").val();
    const ratio = (currentEncumbrance / totalEncumbrance) * 100;

    html.find(".meter-value").width(ratio + "%");
  }

  /* -------------------------------------------- */

// /** @override */
// setPosition(options = {}) {
//   const position = super.setPosition(options);
//   const sheetBody = this.element.find(".sheet-body");
//   const bodyHeight = position.height - 192;
//   sheetBody.css("height", bodyHeight);
//   return position;
// }

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
    if (action === "create") {
      const nk = Object.keys(attrs).length + 1;
      let newKey = document.createElement("div");
      newKey.innerHTML = `<input type="text" name="data.attributes.attr${nk}.key" value="attr${nk}"/>`;
      newKey = newKey.children[0];
      form.appendChild(newKey);
      await this._onSubmit(event);
    }

    // Remove existing attribute
    else if (action === "delete") {
      const li = a.closest(".attribute");
      li.parentElement.removeChild(li);
      await this._onSubmit(event);
    }
  }


  async _render(force = false, options = {}) {
    this._saveScrollPos();
    this._saveToggleState();

    await super._render(force, options);

    this._setScrollPos();
    this._setToggleState();
  }

  // TODO
  _saveSheetLayout() {
    if (this.form === null)
      return;

    const html = $(this.form).parent();

    this.toggleState = [];

    let items = $(html.find(".save-toggle"));

    for (let item of items)
      this.toggleState.push($(item).hasClass("open"));
  }

  _saveToggleState() {
    if (this.form === null)
      return;

    const html = $(this.form).parent();

    this.toggleState = [];

    let items = $(html.find(".save-toggle"));

    for (let item of items)
      this.toggleState.push($(item).hasClass("open"));
  }

  _setToggleState() {
    if (this.toggleState) {
      const html = $(this.form).parent();

      let items = $(html.find(".save-toggle"));

      for (let i = 0; i < items.length; i++) {
        // Check the last description state
        if (this.toggleState[i]) {
          $(items[i]).show().addClass("open");
        } else {
          $(items[i]).hide().removeClass("open");
        }
      }
    }
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
