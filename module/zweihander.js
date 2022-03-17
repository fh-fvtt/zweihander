/**
* An implementation of the Zweihänder Grim & Perilous RPG system for FoundryVTT
* Author: Re4XN
*/

import ZweihanderActor from "./actor/actor";
import ZweihanderCharacterSheet from "./actor/sheet/character-sheet";
import ZweihanderActorConfig from "./apps/actor-config";
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
import { introJs } from "./utils/intros";
import { rollTest } from "./dice";
import { getTestConfiguration } from "./apps/test-config";

import { ZWEI } from "./config.js";

import ZweihanderBaseItem from "./item/entity/base-item";

import "../styles/main.scss"

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
    FortuneTracker.registerPersistingSettings();
    FortuneTracker.INSTANCE = new FortuneTracker(socket);
    FortuneTracker.INSTANCE?.syncState();
    socket.register("updateChatMessage", (messageId, diffData) => {
      game.messages.get(messageId).update(diffData);
    })
  });
  // game.actors.getName('Demon Archer')?.sheet?.render?.(true);
})

Hooks.once("diceSoNiceReady", function () {
  // Dice so Nice integration
  game?.dice3d?.addSFXTrigger?.("zh-outcome", "Zweihander d100", ["Critical Failure", "Failure", "Success", "Critical Success"]);
})


Hooks.once("init", async function () {
  // CONFIG.debug.hooks = true;
  console.log(`Initializing ZWEIHÄNDER: Grim & Perilous RPG System`);
  game.zweihander = {
    ZweihanderActor,
    ZweihanderItem,
    getOrCreateLinkedItem: ZweihanderBaseItem.getLinkedItemEntry.bind(ZweihanderBaseItem),
    utils: ZweihanderUtils,
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
  CONFIG.TinyMCE.skin_url = '/systems/zweihander/tinymce/skins/ui/zweihander';
  CONFIG.TinyMCE.skin = 'zweihander';
  CONFIG.TinyMCE.content_css = ['/css/mce.css', '/systems/zweihander/tinymce/skins/content/zweihander/content.css'];
  CONFIG.statusEffects = [
    {
      id: "dead",
      label: "EFFECT.StatusDead",
      icon: "systems/zweihander/assets/icons/death-skull.svg"
    },
    {
      id: "blind",
      label: "EFFECT.StatusBlind",
      icon: "systems/zweihander/assets/icons/sight-disabled.svg"
    },
    {
      id: "choke",
      label: "EFFECT.StatusChoked",
      icon: "systems/zweihander/assets/icons/slipknot.svg"
    },
    {
      id: "defenseless",
      label: "EFFECT.StatusDefenseless",
      icon: "systems/zweihander/assets/icons/broken-shield.svg"
    },
    {
      id: "disarmed",
      label: "EFFECT.StatusDisarmed",
      icon: "systems/zweihander/assets/icons/sword-break.svg"
    },
    {
      id: "helpless",
      label: "EFFECT.StatusHelpless",
      icon: "systems/zweihander/assets/icons/handcuffed.svg"
    },
    {
      id: "inspired",
      label: "EFFECT.StatusInspired",
      icon: "systems/zweihander/assets/icons/armor-upgrade.svg"
    },
    {
      id: "intimidated",
      label: "EFFECT.StatusIntimidated",
      icon: "systems/zweihander/assets/icons/armor-downgrade.svg"
    },
    {
      id: "knocked",
      label: "EFFECT.StatusKnockedOut",
      icon: "systems/zweihander/assets/icons/knockout.svg"
    },
    {
      id: "prone",
      label: "EFFECT.StatusProne",
      icon: "systems/zweihander/assets/icons/falling.svg"
    },
    {
      id: "stun",
      label: "EFFECT.StatusStunned",
      icon: "systems/zweihander/assets/icons/stoned-skull.svg"
    },
    {
      id: "surprised",
      label: "EFFECT.StatusSurprised",
      icon: "systems/zweihander/assets/icons/surprised.svg"
    },
    {
      id: "burning",
      label: "EFFECT.StatusBurning",
      icon: "systems/zweihander/assets/icons/flame.svg"
    },
    {
      id: "bleeding",
      label: "EFFECT.StatusBleeding",
      icon: "systems/zweihander/assets/icons/bleeding-wound.svg"
    }
  ],
    CONFIG.ZWEI = ZWEI;
  // Define custom Document classes
  CONFIG.Actor.documentClass = ZweihanderActor;
  CONFIG.Item.documentClass = ZweihanderItem;
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


Hooks.on("renderActorSheet", (app, html, data) => {
  //TODO: refactor into actor config class
  if (data.actor.type === 'character') {
    html.find(".header-button.configure-sheet").before(`
    <a class="configure-actor">
    <i class="fas fa-user-cog"></i>
    Actor
    </a>
    `);
    html.find(".configure-actor").click(() => {
      new ZweihanderActorConfig(app.object).render(true);
    })
  } else {
    const compactMode = game.settings.get("zweihander", "openInCompactMode");
    html.find(".header-button.configure-sheet").before(`
    <a class="hide-background">
    <i class="hide-background-toggle fas fa-toggle-${compactMode ? "on" : "off"}"></i>
    Compact
    </a>
    `);
    html.find(".hide-background").click((event) => {
      const sheet = $(event.currentTarget).parents('.sheet');
      sheet.toggleClass('zweihander-compact-sheet');
      $(event.currentTarget).find('.hide-background-toggle')
        .toggleClass('fa-toggle-on')
        .toggleClass('fa-toggle-off');
    })
  }
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
});

Hooks.once("polyglot.init", (LanguageProvider) => {
  class ZweihanderLanguageProvider extends LanguageProvider {
    getUserLanguages(actor) {
      let known_languages = new Set();
      let literate_languages = new Set(); 
      actor.data.data.languages.value
        .split(',').forEach(x => {
          const langAndMod = x.trim().split('(');
          const lang = langAndMod[0].trim().toLowerCase();
          const modifier = (langAndMod[1] ?? '').split(')')[0].trim().toLowerCase();
          known_languages.add(lang);
          if (modifier === 'literate') {
            literate_languages.add(lang);
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