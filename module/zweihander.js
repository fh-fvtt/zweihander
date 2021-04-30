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

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.log(`Initializing ZWEIHÄNDER: Grim & Perilous RPG System`);

  game.zweihander = {
    ZweihanderActor,
    ZweihanderItem
  };

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
  CONFIG.Combat.initiative = {
    formula: "1d10 + @stats.secondaryAttributes.initiative.current",
    decimals: 2
  };

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
    hint: "Enable rule for small item encumbrance, where 9 small items add up to 1 point of encumbrance.",
    scope: "zweihander",
    type: Boolean,
    default: true,
    config: true
  });

  /* -------------------------------------------- */
  /*  Handlebars helpers registration             */
  /* -------------------------------------------- */

  Handlebars.registerHelper("debug", function (optionalValue) {
    console.log("Current Context");
    console.log("====================");
    console.log(this);
    if (optionalValue) {
      console.log("Value");
      console.log("====================");
      console.log(optionalValue);
    }
  });

  Handlebars.registerHelper("getFirstLetter", function (word) {
    if (typeof word !== 'string') return '';
    return word.charAt(0).toUpperCase();
  });

  Handlebars.registerHelper("checkSkillPurchaseForTier", function (skill, tier, options) {
    const tierName = tier.value.trim().toLowerCase();
    const timesAvailable = skill.timesAvailable;

    // An empty input field results in an empty String
    if (skill.name === "")
      return options.inverse(this);

    switch(tierName) {
      case "basic":
        if (!skill.ranks["apprentice"].purchased && timesAvailable == 1)
          return options.inverse(this);
        break;
      case "intermediate":
        if (!skill.ranks["apprentice"].purchased && timesAvailable == 1)
          return options.inverse(this);
        else if (!skill.ranks["journeyman"].purchased && timesAvailable == 2)
          return options.inverse(this);
        break;
      case "advanced":
        if (!skill.ranks["apprentice"].purchased && timesAvailable == 1)
          return options.inverse(this);
        else if (!skill.ranks["journeyman"].purchased && timesAvailable == 2)
          return options.inverse(this);
        else if (!skill.ranks["master"].purchased && timesAvailable == 3)
          return options.inverse(this);
        break;
      default:
        console.log("No such tier:", tierName);
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

  Handlebars.registerHelper("beautifyAncestralModifiers", function (positive, negative) {
    let positiveMap = new Map();
    let negativeMap = new Map();

    const cleanPositiveArray = positive.split(", ");
    const cleanNegativeArray = negative.split(", ");

    for (let modifier of cleanPositiveArray) {
      if (positiveMap.has(modifier)) {
        positiveMap.set(modifier, positiveMap.get(modifier) + 1);
      } else {
        positiveMap.set(modifier, 1);
      }
    }

    for (let modifier of cleanNegativeArray) {
      if (negativeMap.has(modifier)) {
        negativeMap.set(modifier, negativeMap.get(modifier) + 1);
      } else {
        negativeMap.set(modifier, 1);
      }
    }

    let prettyModifiers = [];

    for (let modifier of cleanPositiveArray) {
      const toPush = modifier + "+" + positiveMap.get(modifier);

      if (!prettyModifiers.some(element => element === toPush))
        prettyModifiers.push(toPush);
    }

    for (let modifier of cleanNegativeArray) {
      const toPush = modifier + "-" + negativeMap.get(modifier);

      if (!prettyModifiers.some(element => element === toPush))
        prettyModifiers.push(toPush);
    }

    return prettyModifiers.join(", ");
  });

  Handlebars.registerHelper("checkSecondAncestry", function (idx, options) {
    return idx == 0 ? options.fn(this) : options.inverse(this);
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

  loadTemplates([ "systems/zweihander/templates/actor/actor-sheet.html" ]);

});

// Helper function used to check Item duplicates
var findDifference = function (datasetA, datasetB) {
  let diffArray = [];

  for (let elementA of datasetA)
    if (!datasetB.some(elementB => elementB.name === elementA.name))
      diffArray.push(elementA);

  return diffArray;
};

Hooks.on("createActor", async (actor) => {
  if (actor.data.type === "character") {
    let skillPack = game.packs.get("zweihander.skills");
    let skillIndex = await skillPack.getIndex();

    let toAdd = [];

    for (let idx of skillIndex) {
      let _temp = await skillPack.getDocument(idx._id);
      toAdd.push(_temp.data);
    }

    // Prevent duplicating skills (e.g. when duplicating an Actor)
    let toAddDifference = findDifference(toAdd, actor.data.skills).concat(findDifference(actor.data.skills, toAdd));

    if (toAddDifference.length > 0)
      await actor.createEmbeddedDocuments("Item", toAddDifference);
  }
});

// It is important that the anonymous function here is not async to prevent Item creation (since Hooks do not await)
Hooks.on("preCreateItem", (item, data) => {
  if (item.type === "ancestry") {
    const actor = item.parent;

    // Only one Ancestry per character allowed
    if (actor.data.ancestry.length > 0) {
      console.log("Maximum of 1 Ancestry per character allowed!")
      return false;
    }
  } else if (item.type === "profession") {
    const actor = item.parent;

    if (actor.data.professions.length == 3) {
      console.log("Maximum of 3 Professions per character allowed!")
      return false;
    }
  }
});

Hooks.on("createItem", async (item, data) => {
  const isOwned = item.parent !== null;

  if (item.type === "profession" && isOwned) {

    const actor = item.parent;

    // ------------------------------------------------ //
    //  Assing Tier based on number of professions      //
    // ------------------------------------------------ //

    let tier = actor.data.professions.length;

    switch (tier) {
      case 1:
        await actor.updateEmbeddedDocuments("Item", [ { "_id": item.id, "data.tier.value": "Basic" } ]);
        break;
      case 2:
        await actor.updateEmbeddedDocuments("Item", [ {"_id": item.id, "data.tier.value": "Intermediate"} ]);
        break;
      case 3:
        await actor.updateEmbeddedDocuments("Item", [ {"_id": item.id, "data.tier.value": "Advanced"} ]);
        break;
      default:
        console.log("Tier limit should be capped at 3. Current value:", tier);
    }

    // ------------------------------------------------ //
    //  Get relevant compendium and item data           //
    // ------------------------------------------------ //

    let talentsToFetch = item.data.data.talents.value.split(", ");
    let professionalTraitToFetch = [ item.data.data.professionalTrait.value ];
    let specialTraitToFetch = [ item.data.data.specialTrait.value ];
    let drawbackToFetch = item.data.data.drawback.value;

    let traitsToFetch = professionalTraitToFetch.concat(specialTraitToFetch);

    let talentPack = game.packs.get("zweihander.talents");
    let traitPack = game.packs.get("zweihander.traits");
    let drawbackPack = game.packs.get("zweihander.drawbacks");

    // ------------------------------------------------ //
    //  Get talents from compendium                     //
    // ------------------------------------------------ //

    let talentsIndex = await talentPack.getIndex();
    let talentsToAdd = [];

    for (let value of talentsIndex.values()) {
      if (talentsToFetch.includes(value.name)) {
        let _temp = await talentPack.getDocument(value._id);  // TODO: look into `getDocuments`, which has potential to eliminate the loop
        talentsToAdd.push(_temp.data);
      }
    }

    let talentsToAddDifference = findDifference(talentsToAdd, actor.data.talents);

    // ------------------------------------------------ //
    //  Get professional/special traits from compendium //
    // ------------------------------------------------ //

    let traitIndex = await traitPack.getIndex();
    let traitsToAdd = [];

    for (let value of traitIndex.values()) {
      if (value.name === "")
        continue;

      if (traitsToFetch.includes(value.name)) {
        let _temp = await traitPack.getDocument(value._id);
        traitsToAdd.push(_temp.data);
      }
    }

    let traitsToAddDifference = findDifference(traitsToAdd, actor.data.traits);

    // ------------------------------------------------ //
    //  Get drawback from compendium                    //
    // ------------------------------------------------ //

    let drawbackToAdd = [];

    if (drawbackToFetch.length !== 0) {
      let drawbackIndex = await drawbackPack.getIndex();

      for (let value of drawbackIndex.values()) {
        if (drawbackToFetch === value.name) {
          let _temp = await drawbackPack.getDocument(value._id);
          drawbackToAdd.push(_temp.data);
          
          break;  // maximum one Drawback per Profession
        }
      }
    }

    const drawbackPresent = actor.data.drawbacks.filter(d => d.name === drawbackToAdd[0].name).length > 0;

    // ---------------------------------------------- //
    //  If there are things to create, create them    //
    // ---------------------------------------------- //

    if (traitsToAddDifference.length > 0)
      await actor.createEmbeddedDocuments("Item", traitsToAddDifference);

    if (talentsToAddDifference.length > 0)
      await actor.createEmbeddedDocuments("Item", talentsToAddDifference);

    if (drawbackToAdd !== "" && !drawbackPresent)
      await actor.createEmbeddedDocuments("Item", drawbackToAdd);
  
  } else if (item.type === "ancestry" && isOwned) {
    const actor = item.parent;

    const ancestralTraitToFetch = item.data.data.ancestralTrait.value;

    let traitPack = game.packs.get("zweihander.traits");
    let traitIndex = await traitPack.getIndex();

    let traitToAdd = [];

    for (let value of traitIndex.values()) {
      if (value.name === "")
        continue;

      if (value.name === ancestralTraitToFetch.trim()) {
        let _temp = await traitPack.getDocument(value._id);
        traitToAdd.push(_temp.data);
      }
    }

    let traitToAddDifference = findDifference(traitToAdd, actor.data.traits);

    if (traitToAddDifference.length > 0)
      await actor.createEmbeddedDocuments("Item", traitToAddDifference);
  }
});

Hooks.on("deleteItem", async (item, data) => {
  if (item.type === "profession") {
    const actor = item.parent;

    // ---------------------------------------------- //
    //  Delete Items referenced by a Profession       //
    // ---------------------------------------------- //    

    const talents = item.data.data.talents.value.split(",");
    const traits = [ item.data.data.specialTrait.value ].concat([ item.data.data.professionalTrait.value ]);
    const drawback = item.data.data.drawback.value;

    const itemsToDelete = talents.concat(traits).concat(drawback);

    let arrayOfId = [];

    for (let itemToDelete of itemsToDelete) {
      for (let actorItem of actor.items.values()) {
        if (actorItem.name === itemToDelete.trim()) {
          arrayOfId.push(actorItem.id);
          break;
        }
      }
    }

    await actor.deleteEmbeddedDocuments("Item", arrayOfId);

  } else if (item.type === "ancestry") {
    const actor = item.parent;

    console.log(item);

    const ancestralTrait = item.data.data.ancestralTrait.value;

    let arrayOfId = [];

    for (let actorItem of actor.data.traits) {
      if (actorItem.name === ancestralTrait.trim()) {
        arrayOfId.push(actorItem._id);
        break;
      }
    }

    await actor.deleteEmbeddedDocuments("Item", arrayOfId);
  }
});