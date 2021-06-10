/**
 * An implementation of the Zweihänder Grim & Perilous RPG system for FoundryVTT
 * Author: Re4XN
 */

// Import Modules
import { ZweihanderActor } from "./actor.js";
import { ZweihanderItem } from "./item.js";
import { ZweihanderItemSheet } from "./item-sheet.js";
import { ZweihanderActorSheet } from "./actor-sheet.js";
import { ZweihanderNpcSheet } from "./npc-sheet.js";
import { ZweihanderActorConfig } from "./actor-config.js";

import ZWEI from "./constants.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.log(`Initializing ZWEIHÄNDER: Grim & Perilous RPG System`);

  game.zweihander = {
    ZweihanderActor,
    ZweihanderItem
  };

  CONFIG.ChatMessage.template = "systems/zweihander/templates/chat/chat-message.html";

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
  CONFIG.Combat.initiative = {
    formula: "1d10 + @stats.secondaryAttributes.initiative.current",
    decimals: 2
  };

  CONFIG.ZWEI = ZWEI;

  // Define custom Document classes
  CONFIG.Actor.documentClass = ZweihanderActor;
  CONFIG.Item.documentClass = ZweihanderItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("zweihander", ZweihanderActorSheet, { "types": ["character"], makeDefault: true });
  Actors.registerSheet("zweihander", ZweihanderNpcSheet, { "types": ["npc"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("zweihander", ZweihanderItemSheet, { makeDefault: true });

  /* -------------------------------------------- */
  /*  System settings registration                */
  /* -------------------------------------------- */

  game.settings.register("zweihander", "encumbranceNineForOne", {
    name: "Small Item Encumbrance",
    hint: "Enable or disable rule for small item Encumbrance, where 9 small items add up to 1 point of Encumbrance.",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register("zweihander", "trackRewardPoints", {
    name: "Automatically Track Reward Points",
    hint: "Enable or disable the automatic tracking of Reward Point expenditure.",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  /* -------------------------------------------- */
  /*  Handlebars helpers registration             */
  /* -------------------------------------------- */

  Handlebars.registerHelper("getFirstLetter", function (word) {
    if (typeof word !== 'string') return '';
    return word.charAt(0).toUpperCase();
  });

  Handlebars.registerHelper("capitalize", function (word) {
    if (typeof word !== 'string') return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  Handlebars.registerHelper("checkSkillPurchaseForTier", function (skill, tier, currentTier, options) {
    const professionTierName = tier.value.trim().toLowerCase();
    const currentTierName = currentTier.toLowerCase();
    const timesAvailable = skill.timesAvailable;

    // An empty input field results in an empty String
    if (skill.name === "" || professionTierName === "")
      return options.inverse(this);

    switch (professionTierName) {
      case "basic":
        if (timesAvailable == 1 && currentTierName === professionTierName)
          return options.inverse(this);
        break;
      case "intermediate":
        if (timesAvailable <= 2 && timesAvailable > 0 && currentTierName === professionTierName)
          return options.inverse(this);
        break;
      case "advanced":
        if (timesAvailable <= 3 && timesAvailable > 0)
          return options.inverse(this);
        break;
      default:
        break;
    }

    return options.fn(this);
  });

  Handlebars.registerHelper("checkAdvancePurchaseForTier", function (advance, tier, options) {
    const tierName = tier.value.trim().toLowerCase();

    if (tierName === "basic" && advance.purchased) {
      return options.fn(this);
    } else if (tierName === "intermediate" && advance.purchased) {
      return options.fn(this);
    } else if (tierName === "advanced" && advance.purchased) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  Handlebars.registerHelper("isMissing", function (toCheck, options) {
    if (!Array.isArray(toCheck))
      return toCheck === "" ? options.inverse(this) : options.fn(this);
    else
      return toCheck[0] === "" ? options.inverse(this) : options.fn(this);  // An empty input field results in first element of array becoming the empty String
  });

  Handlebars.registerHelper("oddOrEven", function (idx) {
    if ((idx + 1) % 2)
      return "odd";
    else
      return "even";
  });

  Handlebars.registerHelper("radioRanks", function (name, choices, options) {
    const checked = options.hash['checked'] || null;

    let html = "";

    for ( let [key, label] of Object.entries(choices) ) {
      const isChecked = checked === key;
      html += `<div class="radio-and-number"><input type="radio" class="rd" name="${name}" value="${key}" ${isChecked ? "checked" : ""}><span>${label}</span></div>`;
    }

    return new Handlebars.SafeString(html);
  });

  Handlebars.registerHelper("radioThresholds", function (name, choices, options) {
    const checked = options.hash['checked'] || null;

    let html = "";

    for ( let [key, label] of Object.entries(choices) ) {
      const isChecked = checked === key;
      html += `<div class="radio-and-status"><input type="radio" class="radio-rank" name="${name}" value="${key}" ${isChecked ? "checked" : ""}><span class="status">${label}</span></div>`;
    }

    return new Handlebars.SafeString(html);
  });

  Handlebars.registerHelper("checkUniqueAdvanceType", function(type, associatedSkill) {
    if (type.trim().toLowerCase() === "focus") {
      return `Focus (${associatedSkill})`;
    } else {
      return type;
    }
  });

  Handlebars.registerHelper("displayNpcSkillBonus", function(ranks) {
    let modifier = 0;

    for (let key of Object.keys(ranks)) {
      if (ranks[key].purchased) {
        modifier += 10;
      } else {
        break;
      }
    }

    return modifier !== 0 ? "+" + modifier : "";
  });

  Handlebars.registerHelper("checkTalentPurchased", function(talentOrTrait, options) {
    if (talentOrTrait.type === "talent" && !talentOrTrait.data.purchased) {
      return options.fn(this);
    }
    
    return options.inverse(this);
  });

  Handlebars.registerHelper("rpSettingOn", function(options) {
    return game.settings.get("zweihander", "trackRewardPoints") ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("generateResultText", function(testResult, roll, totalChance, showFlip) {
    const flipString = showFlip ? "*" : "";

    switch (testResult) {
      case 0:
        return new Handlebars.SafeString(`<span class="failure">Critical Failure</span> (${roll} vs. ${totalChance})${flipString}`);
      case 1:
        return new Handlebars.SafeString(`<span class="failure">Failure</span> (${roll} vs. ${totalChance})${flipString}`);
      case 2:
        return new Handlebars.SafeString(`<span class="success">Success</span> (${roll} vs. ${totalChance})${flipString}`);
      case 3:
        return new Handlebars.SafeString(`<span class="success">Critical Success</span> (${roll} vs. ${totalChance})${flipString}`);
      default:
        break;
    }
  });

  Handlebars.registerHelper("generateFlipText", function(flip) {
    return flip === "no-flip" ? "No" : (flip === "fail" ? "To Fail" : "To Succeed");
  });

  Handlebars.registerHelper("checkSuccess", function(testResult, options) {
    return testResult >= 2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("checkCriticalSuccess", function(testResult, options) {
    return testResult === 3 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("checkCriticalFailure", function(testResult, options) {
    return testResult === 0 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("displayIndividualDice", function(arrayOfDice, delimitator, highlight) {
    let expandedFormula = "";

    for (let d = 0; d < arrayOfDice.length; d++) {
      let results = arrayOfDice[d].results;

      for (let i = 0; i < results.length; i++) {
        if (highlight && results[i].result === 6)
          expandedFormula += `<a class="highlight" title="Generate Chaos Manifestation">` + results[i].result + "</a>";
        else
          expandedFormula += results[i].result;

        if (i !== results.length - 1) {
          expandedFormula += delimitator;
        }
      }

      if (d !== arrayOfDice.length - 1) {
        expandedFormula += delimitator;
      }
    }

    return new Handlebars.SafeString(expandedFormula);
  });

  Handlebars.registerHelper("displayFuryDice", function(results, delimitator) {
    let expandedFormula = "";

    for (let i = 0; i < results.length; i++) {
      expandedFormula += results[i].result;

      if (results[i]?.exploded) {
        expandedFormula += "*";
      }

      if (i !== results.length - 1) {
        expandedFormula += delimitator;
      }
    }

    return new Handlebars.SafeString(expandedFormula);
  });

  Handlebars.registerHelper("selectSpellDifficulty", function(optionIdx, principle) {
    switch (principle) {
      case "Petty":
      case "Generalist":
        return optionIdx === 0 ? "selected" : "";
      case "Lesser":
        return optionIdx === 1 ? "selected" : "";
      case "Greater":
        return optionIdx === 2 ? "selected" : "";
      default:
        break;
    }
  });

  loadTemplates([ "systems/zweihander/templates/actor/actor-sheet.html" ]);

});

// It is important that the anonymous function here is not async to prevent Item creation (since Hooks do not await)
Hooks.on("preCreateItem", (item, data) => {
  const isOwned = item.parent !== null;

  if (item.type === "ancestry" && isOwned) {
    const actor = item.parent;

    if (actor.data.ancestry.length > 0) {
      ui.notifications.error("A character may not possess more than 1 Ancestry.");
      return false;
    }
  } else if (item.type === "profession" && isOwned) {
    const actor = item.parent;

    if (actor.data.professions.length == 3) {
      ui.notifications.error("A character may not enter more than 3 Professions.");
      return false;
    } else {
      let previousTiersCompleted = actor.data.professions.map(profession => profession.data.tier.completed).every(value => value === true);;

      if (!previousTiersCompleted) {
        ui.notifications.error("A character must complete the previous Tier before entering a new Profession.");
        return false;
      }
    }
  }
});

Hooks.on("renderActorSheet", (app, html, data) => {
  html.find(".header-button.configure-sheet").before(`
    <a class="configure-actor">
      <i class="fas fa-user-cog"></i>
      Actor
    </a>
  `);

  html.find(".configure-actor").click(() => {
    new ZweihanderActorConfig(app.object).render(true);
  })
});

Hooks.on("renderChatLog", function(log, html, data) {
  // TODO: Refactor into Dice class

  $(html).on("click", ".link-details", (event) => {
    event.preventDefault();

    const toggler = $(event.currentTarget);
    const rollDetails = toggler.parents(".content").find(".roll-details");

    $(rollDetails).slideToggle();
  });
});