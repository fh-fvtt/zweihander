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

Hooks.once("init", async function() {
  console.log(`Initializing ZWEIHÄNDER: Grim & Perilous RPG System`);

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
  //   scope: "world",
  //   type: Boolean,
  //   default: false,
  //   config: true
  // });

  Handlebars.registerHelper("debug", function(optionalValue) {
    console.log("Current Context");
    console.log("====================");
    console.log(this);
    if (optionalValue) {
        console.log("Value");
        console.log("====================");
        console.log(optionalValue);
    }
  });

  Handlebars.registerHelper("getFirstLetter", function(word) {
    if(typeof word !== 'string') return '';
    return word.charAt(0).toUpperCase();
  });
});
