/**
* An implementation of the Zweihänder Grim & Perilous RPG system for FoundryVTT
* Authors: Re4XN, kxfin
*/

import ZweihanderActor from "./actor/actor";
import ZweihanderCharacterSheet from "./actor/sheet/character-sheet";
import ZweihanderNpcSheet from "./actor/sheet/npc-sheet";
import ZweihanderCreatureSheet from "./actor/sheet/creature-sheet";
import ZweihanderItem from "./item/item";
import ZweihanderItemSheet from "./item/sheet/item-sheet";
import FortuneTracker from "./apps/fortune-tracker";
import * as ZweihanderUtils from "./utils";
import * as ZweihanderChat from "./chat";

import { registerSystemSettings } from "./settings";
import { preloadHandlebarsTemplates } from "./template";
import { registerHandlebarHelpers } from "./helpers";
import { migrateWorldSafe, migrateWorld } from "./migration"
import { rollTest, patchDie } from "./dice";
import { getTestConfiguration } from "./apps/test-config";
import { createItemMacro, rollItemMacro } from "./macros";

import { ZWEI } from "./config.js";

import { displayHelpMessage } from "./misc/help";

import "../styles/main.scss"
import { triggerAnalytics } from "./analytics";
import ZweihanderCombat from "./combat/combat";
import ZweihanderCombatant from "./combat/combatant";
import ZweihanderCombatTracker from "./combat/combat-tracker";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

const socket = new Promise((resolve) => {
  Hooks.once("socketlib.ready", () => {
    resolve(socketlib.registerSystem("zweihander"));
  });
})

Hooks.once("ready", function () {
  // this is necessary to apply the theme settings
  // TODO: refactor into own utility-function/class
  let sheetStyles = game.settings.get("zweihander", "theme");
  game.settings.set("zweihander", "theme", sheetStyles);
  migrateWorldSafe();
  socket.then(socket => {
    game.zweihander.socket = socket;
    FortuneTracker.INSTANCE = new FortuneTracker(socket);
    FortuneTracker.INSTANCE?.syncState();
    socket.register("updateChatMessage", (messageId, diffData) => {
      game.messages.get(messageId).update(diffData);
    })
  });
  // game.actors.getName('Demon Archer')?.sheet?.render?.(true);
  // Monkey-Patch Search Filter
  const cleanQuery = SearchFilter.cleanQuery;
  SearchFilter.cleanQuery = (x) => ZweihanderUtils.removeDiacritics(cleanQuery(x));
  triggerAnalytics();
  //..
  const currencySettings = game.settings.get("zweihander", "currencySettings");
  // migration, remove this after a while
  if (currencySettings[0].abbreviation === 'gc' && currencySettings[0].equivalentOfLower === 10) {
    currencySettings[0].equivalentOfLower = 20;
    game.settings.set("zweihander", "currencySettings", currencySettings);
  }
  // patch die class
  patchDie();
  console.log(`systems/zweihander/assets/${game.settings.get('zweihander', 'gameSystem')}-logo.webp`);
  $('#ui-left #logo').attr('src', `systems/zweihander/assets/${game.settings.get('zweihander', 'gameSystem')}-logo.webp`).css('display', 'unset');

  // macro bar support
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

Hooks.once("diceSoNiceReady", function () {
  // Dice so Nice integration
  game?.dice3d?.addSFXTrigger?.("zh-outcome", "Zweihander d100", ["Critical Failure", "Failure", "Success", "Critical Success"]);
});

Hooks.once("init", async function () {
  // CONFIG.debug.hooks = true;
  console.log(ZWEI.debugTitle);

  game.zweihander = {
    ZweihanderActor,
    ZweihanderItem,
    utils: ZweihanderUtils,
    migrateWorld,
    rollItemMacro
  };
  CONFIG.ChatMessage.template = "systems/zweihander/templates/chat/chat-message.hbs";
  /**
  * Set an initiative formula for the system
  * @type {String}
  */
  CONFIG.Combat.initiative = {
    formula: "1d10 + @stats.secondaryAttributes.initiative.value",
    decimals: 2
  };
  CONFIG.TinyMCE.skin_url = 'systems/zweihander/tinymce/skins/ui/zweihander';
  CONFIG.TinyMCE.skin = 'zweihander';
  CONFIG.TinyMCE.content_css = ['/css/mce.css', 'systems/zweihander/tinymce/skins/content/zweihander/content.css'];
  CONFIG.statusEffects = ZWEI.statusEffects;
  CONFIG.ZWEI = ZWEI;
  // Define custom Document classes
  CONFIG.Actor.documentClass = ZweihanderActor;
  CONFIG.Item.documentClass = ZweihanderItem;
  CONFIG.Combat.documentClass = ZweihanderCombat;
  CONFIG.Combatant.documentClass = ZweihanderCombatant;
  CONFIG.ui.combat = ZweihanderCombatTracker;
  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("zweihander", ZweihanderCharacterSheet, { "types": ["character"], makeDefault: true });
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

Hooks.on("renderChatMessage", ZweihanderChat.addLocalChatListeners);
Hooks.on("renderChatLog", (app, html, data) => ZweihanderChat.addGlobalChatListeners(html));
Hooks.on("updateCompendium", async (pack, documents, options, userId) => {
  const skillPackId = game.settings.get("zweihander", "skillPack");
  if (`${pack.metadata.package}.${pack.metadata.name}` === skillPackId) {
    ZweihanderUtils.updateActorSkillsFromPack(skillPackId);
  }
});

//TODO refactor to other file
Hooks.on("chatCommandsReady", function (chatCommands) {
  chatCommands.registerCommand(chatCommands.createCommandFromData({
    commandKey: "/test",
    invokeOnCommand: async (chatlog, messageText, chatdata) => {
      const actors = game.user.isGM ?
        game.canvas.tokens.controlled.map(t => t.actor) :
        [game.actors.get(ZweihanderUtils.determineCurrentActorId(true))];
      let testConfiguration;
      if (actors.length === 0) {
        ui.notifications.warn(`Please select a token in order to perform this action!`);
      }
      for (let actor of actors) {
        const skillItem = actor?.items?.find?.(i => i.type === 'skill' && ZweihanderUtils.normalizedEquals(i.name, messageText));
        if (skillItem) {
          if (!testConfiguration) {
            testConfiguration = await getTestConfiguration(skillItem);
          }
          await rollTest(skillItem, 'skill', testConfiguration);
        } else if (actor) {
          ui.notifications.warn(`Couldn't find a skill named ${messageText}`);
          break;
        }
      }
    },
    shouldDisplayToChat: false,
    iconClass: "fa-comment-dots",
    description: "Do a Skill Test"
  }));
  chatCommands.registerCommand(chatCommands.createCommandFromData({
    commandKey: "/help",
    invokeOnCommand: displayHelpMessage,
    shouldDisplayToChat: false,
    iconClass: "fa-question",
    description: "Show System Documentation"
  }));
});

Hooks.once("polyglot.init", (LanguageProvider) => {
  class ZweihanderLanguageProvider extends LanguageProvider {
    getUserLanguages(actor) {
      let known_languages = new Set();
      let literate_languages = new Set();
      actor.data.data.languages.forEach(l => {
        known_languages.add(l.name.toLowerCase());
        if (l.isLiterate) {
          literate_languages.add(l.name.toLowerCase());
        }
      });
      return [known_languages, literate_languages];
    }
    conditions(polyglot, lang) {
      return polyglot.literate_languages.has(lang);
    }
  }
  game.polyglot.registerSystem("zweihander", ZweihanderLanguageProvider)
});

// Fix for Combat Carousel (Remove this after they fixed the bug)
Hooks.on("updateActor", (actor, updateData, options, userId) => {
  if (ui.combatCarousel) {
    const enabled = game.settings.get("combat-carousel", "enabled");

    if (!enabled || !game.combat || ui.combatCarousel?._collapsed) return;

    if (!game.combat?.combatants.some(c => c.actor.id === actor.id)) return;

    ui.combatCarousel.render();
  }
});