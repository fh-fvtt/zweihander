/**
* An implementation of the Zweihänder Grim & Perilous RPG system for FoundryVTT
* Author: Re4XN
*/

import ZweihanderActor from "./actor/actor";
import ZweihanderActorSheet from "./actor/sheet/actor-sheet";
import ZweihanderActorConfig from "./apps/actor-config";
import ZweihanderNpcSheet from "./actor/sheet/npc-sheet";
import ZweihanderCreatureSheet from "./actor/sheet/creature-sheet";
import ZweihanderItem from "./item/item";
import ZweihanderItemSheet from "./item/sheet/item-sheet";
import FortuneTracker from "./apps/fortune-tracker";
import * as ZweihanderUtils from "./utils";

import { registerSystemSettings } from "./settings";
import { preloadHandlebarsTemplates } from "./template";
import { registerHandlebarHelpers } from "./helpers";
import { migrateWorldSafe, migrateWorld } from "./migration"
import { introJs } from "./utils/intros";

import ZWEI from "./constants.js";

import "../styles/main.scss"

let fortuneTrackerApp;

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once("socketlib.ready", () => {
  FortuneTracker.registerPersistingSettings();
  const socket = socketlib.registerSystem("zweihander");
  fortuneTrackerApp = new FortuneTracker(socket);
});

Hooks.once("ready", function () {
  // this is necessary to apply the theme settings
  // TODO: refactor into own utility-function/class
  let sheetStyles = game.settings.get("zweihander", "theme");
  game.settings.set("zweihander", "theme", sheetStyles);
  fortuneTrackerApp?.syncState();//.then(() => introJs().start());
  migrateWorldSafe();
})

Hooks.once("init", async function () {
  // CONFIG.debug.hooks = true;
  console.log(`Initializing ZWEIHÄNDER: Grim & Perilous RPG System`);
  game.zweihander = {
    ZweihanderActor,
    ZweihanderItem,
    find: ZweihanderUtils.findItemsWorldWide,
    fortuneTrackerApp,
    migrate: migrateWorld,
    introJs: introJs
  };
  CONFIG.ChatMessage.template = "systems/zweihander/templates/chat/chat-message.hbs";
  /**
  * Set an initiative formula for the system
  * @type {String}
  */
  CONFIG.Combat.initiative = {
    formula: "1d10 + @stats.secondaryAttributes.initiative.current",
    decimals: 2
  };
  //TODO probably better to export / import those constants rather than setting on global object.
  CONFIG.ZWEI = ZWEI;
  // Define custom Document classes
  CONFIG.Actor.documentClass = ZweihanderActor;
  CONFIG.Item.documentClass = ZweihanderItem;
  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("zweihander", ZweihanderActorSheet, { "types": ["character"], makeDefault: true });
  Actors.registerSheet("zweihander", ZweihanderNpcSheet, { "types": ["npc"], makeDefault: true });
  Actors.registerSheet("zweihander", ZweihanderCreatureSheet, { "types": ["creature"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("zweihander", ZweihanderItemSheet, { makeDefault: true });
  // Register settings
  registerSystemSettings();
  // Register Helpers
  await registerHandlebarHelpers();
  // Register Templates
  return preloadHandlebarsTemplates();
});


Hooks.on("renderActorSheet", (app, html, data) => {
  //TODO: refactor into actor config class
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

Hooks.on("renderChatLog", function (log, html, data) {
  // TODO: Refactor into Dice class

  $(html).on("click", ".link-details", (event) => {
    event.preventDefault();

    const toggler = $(event.currentTarget);
    const rollDetails = toggler.parents(".content").find(".roll-details");

    $(rollDetails).slideToggle();
  });
});