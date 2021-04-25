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
      width: 689, //720,
      height: 890, //945,
      resizable: false,
      tabs: [
        { navSelector: ".main-tabs", contentSelector: ".sheet-body", initial: "main" },
        { navSelector: ".trapping-tabs", contentSelector: ".trapping-tabs-content", initial: "weapons" },
        { navSelector: ".tiers-tabs", contentSelector: ".professions-talents-unique-content", initial: "professions" },
        { navSelector: ".magick-tabs", contentSelector: ".magick-tabs-content", initial: "spells" }
      ],
      scrollY: [".common-list.skills.save-scroll", 
        ".common-list.unique-advances.save-scroll",
        ".common-list.drawback.save-scroll",
        "common-list.save-scroll",
        "common-list.magick.save-scroll",
        "common-list.professions.save-scroll",
      ]
    });
  }

  /* -------------------------------------------- */

  constructor(...args){
    super(...args);
    this.renderable = true;
  }

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    if (this.actor.data.type === "character") {
      data.data.rankOptions = {1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9"};
      data.data.perilOptions = {5: "Unhindered", 4: "Imperiled", 3: "Ignore 1 Skill Rank", 2: "Ignore 2 Skill Ranks", 1: "Ignore 3 Skill Ranks", 0: "INCAPACITATED!"};
      data.data.damageOptions = {5: "Unharmed", 4: "Lightly Wounded", 3: "Moderately Wounded", 2: "Seriously Wounded", 1: "Grievously Wounded", 0: "SLAIN!"};
    }

    return data.data;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    let actorData = this.actor.data;

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

      await this.actor.deleteEmbeddedDocuments("Item", [ li.data("itemId") ]);
      li.slideUp(200, () => this.render(false));
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

    // toFormat.replace(/(@([a-zA-Z0-9]\.)*[a-zA-Z0-9]+)/g, (key) => resolveProperty(actorData, key))

    // Handle formulas for display
    html.find('.fetch-property').each(function () {
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
      }
    });

    // Update the value of the Damage Threshold label depending on armor worn
    this._updateDamageThresholdLabel(html);

    // On loss of focus, update the textbox value
    html.find(".notepad").focusout(async event => {
      await this.actor.update({ "data.flavor.notes": event.target.value });
    });

    // Update the encumbrance meter
    this._updateEncumbranceMeter(html);

    // Show extra item information on click
    html.find(".item-description").click(event => this._showItemDescription(event));

    // TODO: When a profession is deleted, iterate over skills and remove ranks

    // Show item sheet on right click
    html.find(".fetch-item").contextmenu(event => {
      const target = $(event.currentTarget);
      const skillName = target.text().trim();
      const itemId = actorData.items.find(item => item.name === skillName)._id;

      if (itemId) {
        const skillItem = this.actor.items.get(itemId);
        skillItem.sheet.render(true);
      }
    });

    // Purchase skill rank
    html.find(".skill-link").click(async event => {
      const target = $(event.currentTarget);
      const skillName = target.text().trim();
      const itemId = actorData.items.find(item => item.name === skillName)._id;

      if (itemId) {
        const skillItem = this.actor.items.get(itemId);
        const skillData = skillItem.data.data;
        if (target.hasClass("not-purchased")) {
          if (!skillData.ranks.apprentice.purchased) {
            await skillItem.update({ "data.ranks.apprentice.purchased": true });
          } else if (!skillData.ranks.journeyman.purchased && skillData.ranks.apprentice.purchased) {
            await skillItem.update({ "data.ranks.journeyman.purchased": true });
          } else if (!skillData.ranks.master.purchased && skillData.ranks.journeyman.purchased && skillData.ranks.apprentice.purchased) {
            await skillItem.update({ "data.ranks.master.purchased": true });
          } else {
            console.log("Unable to purchase additional ranks for this tier.");
          }
        } else {
          if (skillData.ranks.apprentice.purchased && !skillData.ranks.journeyman.purchased && !skillData.ranks.master.purchased) {
            await skillItem.update({ "data.ranks.apprentice.purchased": false });
          } else if (skillData.ranks.journeyman.purchased && !skillData.ranks.master.purchased) {
            await skillItem.update({ "data.ranks.journeyman.purchased": false });
          } else if (skillData.ranks.master.purchased) {
            await skillItem.update({ "data.ranks.master.purchased": false });
          } else {
            console.log("Unable to delete additional ranks for this tier.");
          }
        }
      }
    });

    // Purchase bonus advance
    html.find(".advance-link").click(async event => {
      const target = $(event.currentTarget);
      const targetIdx = Number(target.attr("id").split("-")[1]);
      const advanceName = target.text();
      const professionElement = target.closest(".individual-description").siblings(".item");
      const professionItem = this.actor.items.get($(professionElement).data("itemId"));
      
      if (professionItem.data.data.tier.value !== "") {
        for (let advance of professionItem.data.data.bonusAdvances.arrayOfValues) {
          if ((advance.name === advanceName) && (advance.index === targetIdx)) {
            advance.purchased = !advance.purchased;
            break;
          }
        }

        const sheet = this;

        await professionItem.update({
          "data.bonusAdvances.arrayOfValues": professionItem.data.data.bonusAdvances.arrayOfValues, 
          "data.skillRanks.arrayOfValues": professionItem.data.data.skillRanks.arrayOfValues, 
          "data.talents.arrayOfValues": professionItem.data.data.talents.arrayOfValues}).then(function() {
          sheet.submit();
        });
      } else {
        console.log("Profession has unspecified Tier:", professionItem.data.name);
      }
    });

    // Purchase talent 
    html.find(".talent-link").click(async event => {
      const target = $(event.currentTarget);
      const talentName = target.text().trim();
      const itemId = actorData.talents.find(item => item.name === talentName)._id;

      if (itemId) {
        const talentItem = this.actor.items.get(itemId);
        const talentData = talentItem.data.data;

        this.renderable = false;

        await talentItem.update({ "data.purchased": !talentData.purchased }, { "renderSheet": false });

        this.renderable = true;

        await this._render(false);
      }
    });

    // Alternate color for lists
    this._alternateRowColor(html);

    // Roll
    html.find(".skill-roll").click(this._onRoll.bind(this));
  }

  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    const skill = dataset.label.toLowerCase();
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

      let template = "systems/zweihander/templates/chat/chat-skill.html";

      if (dataset.roll) {
        let roll = new Roll(dataset.roll, this.actor.data.data);
        let label = dataset.label ? `Rolling against ${dataset.label} (${rollAgainst + rankBonus})` : '';

        roll.roll().render().then(r => {
          let templateData = {
            skill: label
          };

          renderTemplate(template, templateData).then(c => {
            let chatData = {
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: c
            };
        
            ChatMessage.create(chatData);
          });
        });
      }
    }
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
      html.find(".meter-label").css("color", "indianred");
    }

    html.find(".meter-value").width(ratio + "%");
  }

  /* -------------------------------------------- */

  /** @override */
  _onChangeTab(event, tabs, active) {
    if (active === "trappings") {
      this._tabs[1].activate(this._tabs[1].active);
    }

    if (active === "tiers") {
      this._tabs[2].activate(this._tabs[2].active);
    }

    if (active === "magick") {
      this._tabs[3].activate(this._tabs[3].active);
    }

    super._onChangeTab();
  }

  async _render(force = false, options = {}) {
    if (!this.renderable) return;
    //this._saveScrollPos();
    this._saveToggleState();

    await super._render(force, options);

    // this._setScrollPos();
    this._setToggleState();
  }

  _saveToggleState() {
    if (this.form === null)
      return;

    const html = $(this.form).parent();

    this.toggleState = [];

    let items = $(html.find(".save-toggle"));

    for (let item of items) {
      this.toggleState.push($(item).hasClass("open"));
    }
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
  async _updateObject(event, formData) {

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
    return await this.object.update(formData);
  }
}
