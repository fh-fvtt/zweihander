/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Re4XN
 * Software License: GNU GPLv3
 */

// Import Modules
import { ZweihanderActor } from "./actor.js";
import { ZweihanderItem } from "./item.js";
import { ZweihanderItemSheet } from "./item-sheet.js";
import { ZweihanderActorSheet } from "./actor-sheet.js";

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

  // Define custom Entity classes
  CONFIG.Actor.entityClass = ZweihanderActor;
  CONFIG.Item.entityClass = ZweihanderItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("zweihander", ZweihanderActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("zweihander", ZweihanderItemSheet, { makeDefault: true });

  // Register system settings
  // game.settings.register("zweihander", "macroShorthand", {
  //   name: "Shortened Macro Syntax",
  //   hint: "Enable a shortened macro syntax which allows referencing attributes directly, for example @str instead of @attributes.str.value. Disable this setting if you need the ability to reference the full attribute model, for example @attributes.str.label.",
  //   scope: "zweihander",
  //   type: Boolean,
  //   default: false,
  //   config: true
  // });

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

  Handlebars.registerHelper("oddOrEven", function (idx) {
    if ((idx + 1) % 2)
      return "odd";
    else
      return "even";
  });
});

// Helper function used to check Item duplicates
var findDifference = function (datasetA, datasetB) {
  let diffArray = [];

  for (let elementA of datasetA)
    if (!datasetB.some(elementB => elementB.name === elementA.name))
      diffArray.push(elementA);

  return diffArray;
};

Hooks.on("createActor", async (actor, options, id) => {
  if (actor.data.type === "character") {
    let skillPack = game.packs.get("zweihander.skills");
    let skillIndex = await skillPack.getIndex();

    let toAdd = [];

    for (let idx of skillIndex) {
      let _temp = await skillPack.getEntity(idx._id);
      toAdd.push(_temp.data);
    }

    // Prevent duplicating skills (e.g. when duplicating an Actor)
    let toAddDifference = findDifference(toAdd, actor.data.skills).concat(findDifference(actor.data.skills, toAdd));

    if (toAddDifference.length > 0)
      await actor.createEmbeddedEntity("OwnedItem", toAddDifference);
  }
});

Hooks.on("createOwnedItem", async (actor, item) => {
  if (item.type === "profession") {

    // ------------------------------------------------ //
    //  Assing Tier based on number of professions      //
    // ------------------------------------------------ //

    let tier = actor.data.professions.length + 1;

    switch (tier) {
      case 1:
        await actor.updateEmbeddedEntity("OwnedItem", {"_id": item._id, "data.tier.value": "Basic"});
        break;
      case 2:
        await actor.updateEmbeddedEntity("OwnedItem", {"_id": item._id, "data.tier.value": "Intermediate"});
        break;
      case 3:
        await actor.updateEmbeddedEntity("OwnedItem", {"_id": item._id, "data.tier.value": "Advanced"});
        break;
      default:
        console.log("Tier limit should be capped at 3. Current value:", tier);
    }

    // ------------------------------------------------ //
    //  Get relevant compendium and item data           //
    // ------------------------------------------------ //

    let talentsToFetch = item.data.talents.value.split(", ");
    let professionalTraitToFetch = [item.data.professionalTrait.value];
    let specialTraitToFetch = [item.data.specialTrait.value];
    let drawbackToFetch = item.data.drawback.value;

    let traitsToFetch = professionalTraitToFetch.concat(specialTraitToFetch);

    let talentPack = game.packs.get("zweihander.talents");
    let traitPack = game.packs.get("zweihander.traits");
    let drawbackPack = game.packs.get("zweihander.drawbacks");

    // ------------------------------------------------ //
    //  Get talents from compendium                     //
    // ------------------------------------------------ //

    let talentsIndex = await talentPack.getIndex();
    let talentsToAdd = [];

    for (let talent of talentsToFetch) {
      let _temp = await talentPack.getEntity(talentsIndex[talentsIndex.findIndex(idx => idx.name === talent)]._id);
      talentsToAdd.push(_temp.data);
    }

    let talentsToAddDifference = findDifference(talentsToAdd, actor.data.talents);

    // ------------------------------------------------ //
    //  Get professional/special traits from compendium //
    // ------------------------------------------------ //

    let traitIndex = await traitPack.getIndex();
    let traitsToAdd = [];

    for (let trait of traitsToFetch) {
      if (trait === "")
        continue;

      let _temp = await traitPack.getEntity(traitIndex[traitIndex.findIndex(idx => idx.name === trait)]._id);
      traitsToAdd.push(_temp.data);
    }

    let traitsToAddDifference = findDifference(traitsToAdd, actor.data.traits);

    // ------------------------------------------------ //
    //  Get drawback from compendium                    //
    // ------------------------------------------------ //

    let drawbackToAdd = "";

    if (drawbackToFetch !== "") {
      let drawbackIndex = await drawbackPack.getIndex();

      let _temp = await drawbackPack.getEntity(drawbackIndex[drawbackIndex.findIndex(idx => idx.name === drawbackToFetch)]._id);
      drawbackToAdd = _temp.data;
    }

    // ---------------------------------------------- //
    //  If there are things to create, create them    //
    // ---------------------------------------------- //

    if (traitsToAddDifference.length > 0) {
      await actor.createEmbeddedEntity("OwnedItem", traitsToAddDifference);
    }

    if (talentsToAddDifference.length > 0)
      await actor.createEmbeddedEntity("OwnedItem", talentsToAddDifference);

    if (drawbackToAdd !== "" && !actor.data.drawbacks.includes(drawbackToAdd))
      await actor.createEmbeddedEntity("OwnedItem", drawbackToAdd);
  }
});