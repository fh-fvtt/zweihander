/**
 * The Zweihänder actor sheet class for characters.
 * @extends {ActorSheet}
 */
export class ZweihanderActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [ "zweihander", "sheet", "character" ],
      template: "systems/zweihander/templates/actor/actor-sheet.html",
      width: 689,
      height: 890,
      resizable: false,
      tabs: [
        { navSelector: ".main-tabs", contentSelector: ".sheet-body", initial: "main" },
        { navSelector: ".trapping-tabs", contentSelector: ".trapping-tabs-content", initial: "weapons" },
        { navSelector: ".tiers-tabs", contentSelector: ".professions-talents-unique-content", initial: "professions" },
        { navSelector: ".magick-tabs", contentSelector: ".magick-tabs-content", initial: "spells" },
        { navSelector: ".afflictions-tabs", contentSelector: ".afflictions-tabs-content", initial: "condition" }
      ],
      scrollY: /* [ 
        "#skill_scroll",
        "#drawbacks_scroll",
        "#weapons_scroll",
        "#armor_scroll",
        "#trappings_scroll", 
        "#conditions_scroll", 
        "#injuries_scroll", 
        "#diseases_scroll",
        "#disorders_scroll",
        "#spells_scroll",
        "#rituals_scroll",
        "#professions_scroll",
        "#talents_scroll",
        "#unique_advances_scroll"
      ] */ []
    });
  }

  /** @override */
  getData() {
    const data = super.getData();

    if (this.actor.data.type === "character") {
      data.data.rankOptions = {1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9"};
      data.data.perilOptions = {5: "Unhindered", 4: "Imperiled", 3: "Ignore 1 Skill Rank", 2: "Ignore 2 Skill Ranks", 1: "Ignore 3 Skill Ranks", 0: "INCAPACITATED!"};
      data.data.damageOptions = {5: "Unharmed", 4: "Lightly Wounded", 3: "Moderately Wounded", 2: "Seriously Wounded", 1: "Grievously Wounded", 0: "SLAIN!"};
    }

    data.data.skills = this.actor.data.skills;
    data.data.professions = this.actor.data.professions;
    data.data.spells = this.actor.data.spells;
    data.data.weapons = this.actor.data.weapons;
    data.data.armor = this.actor.data.armor;
    data.data.trappings = this.actor.data.trappings;
    data.data.talents = this.actor.data.talents;
    data.data.traits = this.actor.data.traits;
    data.data.rituals = this.actor.data.rituals;
    data.data.ancestry = this.actor.data.ancestry;
    data.data.drawbacks = this.actor.data.drawbacks;
    data.data.injuries = this.actor.data.injuries;
    data.data.diseases = this.actor.data.diseases;
    data.data.disorders = this.actor.data.disorders;
    data.data.conditions = this.actor.data.conditions;
    data.data.uniqueAdvances = this.actor.data.uniqueAdvances;

    data.data.talentsAndTraits = this.actor.data.talents.concat(this.actor.data.traits);

    const actorProfessions = this.actor.data.professions.map(profession => profession.data.tier.value);

    data.data.currentTier = actorProfessions[actorProfessions.length - 1];

    return data.data;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const trackRewardPointsOn = game.settings.get("zweihander", "trackRewardPoints");

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
      const itemName = li.children(".image-and-name").children("span").text();

      await Dialog.confirm({
        title: `Delete Embedded Item: ${itemName}`,
        content: "<p>Are you sure?</p><p>This item will be permanently deleted and cannot be recovered.</p>",
        yes: async () => {
          await this.actor.deleteEmbeddedDocuments("Item", [ li.data("itemId") ]);
          li.slideUp(200, () => this.render(false));
        },
        no: () => {},
        defaultYes: true
      });
    });

    // Add new Item (from within the sheet)
    html.find('.add-new').click(async ev => {
      let type = ev.currentTarget.dataset.itemType;

      if (type === "talentTrait") {
        // TODO: add Dialog to choose
        console.log("TODO: allow user to choose between Talent and Trait");
        return;
      }

      const createdItemArray = await this.actor.createEmbeddedDocuments("Item", [ 
        { "type": type, "name": type } 
      ]);

      if (createdItemArray.length)
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
      } else if (item.type === "condition" || item.type === "injury" || item.type === "disease" || item.type === "disorder") {
        await item.update({ "data.active": event.target.checked });
      }
    });

    // Update the value of the Damage Threshold label depending on armor worn
    this._updateDamageThresholdLabel(html);

    // TODO: When a profession is deleted, iterate over skills and remove ranks

    // Show item sheet on right click
    html.find(".fetch-item").contextmenu(event => {
      const target = $(event.currentTarget);
      const skillName = target.text().trim();
      const itemId = actorData.items.find(item => item.name === skillName).id;

      if (itemId) {
        const skillItem = this.actor.items.get(itemId);
        skillItem.sheet.render(true);
      }
    });

    // Purchase skill rank
    html.find(".skill-link").click(async event => {
      const target = $(event.currentTarget);
      const skillName = target.text().trim();
      const itemId = actorData.skills.find(skill => skill.name === skillName)._id;

      const tier = $(event.currentTarget).parents(".individual-trapping-and-description").find(".tier").text();

      if (itemId) {
        const skillItem = this.actor.items.get(itemId);
        const skillData = skillItem.data.data;

        let _tempBoolean;
        
        if (target.hasClass("not-purchased")) {
          _tempBoolean = true;

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
          _tempBoolean = false;

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

        if (trackRewardPointsOn)
          await this._handleRewardPoints(tier, _tempBoolean);
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
        const tier = professionItem.data.data.tier.value;
                
        let _tempBoolean;

        for (let advance of professionItem.data.data.bonusAdvances.arrayOfValues) {
          if ((advance.name === advanceName) && (advance.index === targetIdx)) {
            advance.purchased = !advance.purchased;
            _tempBoolean = advance.purchased;
            break;
          }
        }

        await professionItem.update({
          "data.bonusAdvances.arrayOfValues": professionItem.data.data.bonusAdvances.arrayOfValues, 
          "data.skillRanks.arrayOfValues": professionItem.data.data.skillRanks.arrayOfValues, 
          "data.talents.arrayOfValues": professionItem.data.data.talents.arrayOfValues
        });

        if (trackRewardPointsOn)
          await this._handleRewardPoints(tier, _tempBoolean);
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
        
        await talentItem.update({ "data.purchased": !talentData.purchased });

        const tier = $(event.currentTarget).parents(".individual-trapping-and-description").find(".tier").text();

        if (trackRewardPointsOn)
          await this._handleRewardPoints(tier, talentItem.data.data.purchased);
      }
    });

    // Reset Order and Chaos Ranks
    html.find(".reset-ranks").click(async () => {
      await this.actor.update({ 
        "data.chaosRanks.value": "0",
        "data.orderRanks.value": "0"
      });
    });

    this._damageSheet(html);

    // Update the encumbrance meter
    this._updateEncumbranceMeter(html);

    // Show extra item information on click
    html.find(".item-description").click(event => this._showItemDescription(event));

    // Roll
    html.find(".skill-roll").click(this._onRoll.bind(this));
  }

  async _handleRewardPoints(tier, purchased) {
    const currentProfessionItemData = this.actor.data.professions.filter(profession => profession.data.tier.value === tier)[0];
    const advancesPurchasedForTier = currentProfessionItemData.data.tier.advancesPurchased;

    await this.actor.updateEmbeddedDocuments("Item", [
      { "_id": currentProfessionItemData._id, "data.tier.advancesPurchased": (purchased ? (advancesPurchasedForTier + 1) : (advancesPurchasedForTier - 1)) }
    ]);
  }

  _damageSheet(html) {
    if (Number(this.actor.data.data.stats.secondaryAttributes.damageCurrent.value) === 0) {
      html.find('.sheet-background').css("background-image", "url(/systems/zweihander/assets/background_bloody.png)")
    }
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

  _showItemDescription(event) {
    event.preventDefault();

    const toggler = $(event.currentTarget);
    const item = toggler.parents(".individual-trapping-and-description");
    const description = item.find(".individual-description");

    $(description).slideToggle(function() {
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

    else if (active === "tiers") {
      this._tabs[2].activate(this._tabs[2].active);
    }

    else if (active === "magick") {
      this._tabs[3].activate(this._tabs[3].active);
    }

    else if (active === "afflictions") {
      this._tabs[4].activate(this._tabs[4].active);
    }

    super._onChangeTab();
  }

  /** @override */
  async _render(force = false, options = {}) {
    this._saveToggleStates();
    this._saveScrollStates();

    await super._render(force, options);

    this._setToggleStates();
    this._setScrollStates();
  }

  _saveToggleStates() {
    if (this.form === null)
      return;

    const html = $(this.form).parent();

    this.toggleStates = [];

    let items = $(html.find(".save-toggle"));

    for (let item of items) {
      this.toggleStates.push($(item).hasClass("open"));
    }
  }

  _setToggleStates() {
    if (this.toggleStates) {
      const html = $(this.form).parent();

      let items = $(html.find(".save-toggle"));

      for (let i = 0; i < items.length; i++) {
        if (this.toggleStates[i]) {
          $(items[i]).show().addClass("open");
        } else {
          $(items[i]).hide().removeClass("open");
        }
      }
    }
  }

  _saveScrollStates() {
    if (this.form === null)
      return;

    const html = $(this.form).parent();

    this.scrollStates = [];

    let lists = $(html.find(".save-scroll"));

    for (let list of lists) {
      this.scrollStates.push($(list).scrollTop());
    }
  }

  _setScrollStates() {
    if (this.scrollStates) {
      const html = $(this.form).parent();

      let lists = $(html.find(".save-scroll"));

      for (let i = 0; i < lists.length; i++) {
        $(lists[i]).scrollTop(this.scrollStates[i]);
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {

    // Handle the free-form attributes list
    /*console.log("TEST formData :::: ", formData);
    console.log("TEST expandObject(formData) :::: ", expandObject(formData));
    console.log("TEST expandObject(formData).data :::: ", expandObject(formData).data);
    
    const formAttrs = expandObject(formData).data.attributes || {};
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
