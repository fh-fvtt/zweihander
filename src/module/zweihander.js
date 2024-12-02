/**
 * An implementation of the Zweihänder Grim & Perilous RPG system for FoundryVTT
 * Authors: Re4XN, kxfin
 */

import '../index.scss';

import ZweihanderActor from './actor/actor';
import ZweihanderCharacterSheet from './actor/sheet/character-sheet';
import ZweihanderNpcSheet from './actor/sheet/npc-sheet';
import ZweihanderCreatureSheet from './actor/sheet/creature-sheet';
import ZweihanderVehicleSheet from './actor/sheet/vehicle-sheet';
import ZweihanderItem from './item/item';
import ZweihanderItemSheet from './item/sheet/item-sheet';
import FortuneTracker from './apps/fortune-tracker';
import * as ZweihanderUtils from './utils';
import * as ZweihanderChat from './chat';
import { registerChatCommands } from './misc/chat-commands';

import { registerSystemSettings, setCssTheme } from './settings';
import { preloadHandlebarsTemplates } from './templates';
import { registerHandlebarHelpers } from './helpers';
// import { migrateWorldSafe, migrateWorld } from './migration';
import { patchDie } from './dice';
import { createItemMacro, rollItemMacro } from './macros';

import { ZWEI } from './config';

import { triggerAnalytics } from './analytics';
import ZweihanderCombat from './combat/combat';
import ZweihanderCombatant from './combat/combatant';
import ZweihanderCombatTracker from './combat/combat-tracker';
import ZweihanderActiveEffect from './effects/active-effect';
import ZweihanderActiveEffectConfig from './apps/active-effect-config';
import { performWorldMigrations, migrations } from './migration';

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

CONFIG.compatibility.mode = CONST.COMPATIBILITY_MODES.SILENT;

const socket = new Promise((resolve) => {
  Hooks.once('socketlib.ready', () => {
    resolve(socketlib.registerSystem('zweihander'));
  });
});

Hooks.once('ready', function () {
  // this is necessary to apply the theme settings
  let sheetStyles = game.settings.get('zweihander', 'theme');
  setCssTheme(sheetStyles);

  performWorldMigrations();
  socket.then((socket) => {
    game.zweihander.socket = socket;
    FortuneTracker.INSTANCE = new FortuneTracker(socket);
    FortuneTracker.INSTANCE?.syncState();
    socket.register('updateChatMessage', (messageId, diffData) => {
      game.messages.get(messageId).update(diffData);
    });
  });
  // game.actors.getName('Demon Archer')?.sheet?.render?.(true);
  // Monkey-Patch Search Filter
  const cleanQuery = SearchFilter.cleanQuery;
  SearchFilter.cleanQuery = (x) => ZweihanderUtils.removeDiacritics(cleanQuery(x));
  // disable analytics temporarily until I get the chance to update my SSL certificate
  // triggerAnalytics();
  //..
  const currencySettings = game.settings.get('zweihander', 'currencySettings');
  // migration, remove this after a while
  if (currencySettings[0].abbreviation === 'gc' && currencySettings[0].equivalentOfLower === 10) {
    currencySettings[0].equivalentOfLower = 20;
    game.settings.set('zweihander', 'currencySettings', currencySettings);
  }
  // patch die class
  patchDie();
  console.log(`systems/zweihander/assets/${game.settings.get('zweihander', 'gameSystem')}-logo.webp`);
  $('#ui-left #logo')
    .attr('src', `systems/zweihander/assets/${game.settings.get('zweihander', 'gameSystem')}-logo.webp`)
    .css('display', 'unset');

  // macro bar support
  Hooks.on('hotbarDrop', (bar, data, slot) => {
    createItemMacro(data, slot);
    return false;
  });
});

Hooks.once('diceSoNiceReady', function () {
  // Dice so Nice integration
  game?.dice3d?.addSFXTrigger?.('zh-outcome', 'Zweihander d100', [
    'Critical Failure',
    'Failure',
    'Success',
    'Critical Success',
  ]);
});

Hooks.once('dragRuler.ready', (SpeedProvider) => {
  // Drag Ruler integration
  class zweihanderSpeedProvider extends SpeedProvider {
    get colors() {
      return [
        { id: 'maneuver', default: 0x1259b6, name: 'ZWEI.speeds.maneuver' },
        { id: 'hustle', default: 0x00ff00, name: 'ZWEI.speeds.hustle' },
        { id: 'charge', default: 0xffff00, name: 'ZWEI.speeds.charge' },
        { id: 'run', default: 0xff8000, name: 'ZWEI.speeds.run' },
      ];
    }

    getRanges(token) {
      // MANEUVER: 1 yd
      // HUSTLE: MOV
      // CHARGE: MOV*2
      // RUN: MOV*3
      const movement = token.actor.system.stats.secondaryAttributes.movement;

      const minSpeed = 1;
      const baseSpeed = movement.current ?? movement.value;
      const chargeSpeed = baseSpeed * 2;
      const runSpeed = baseSpeed * 3;

      const ranges = [
        { range: minSpeed, color: 'maneuver' },
        { range: baseSpeed, color: 'hustle' },
        { range: chargeSpeed, color: 'charge' },
        { range: runSpeed, color: 'run' },
      ];

      return ranges;
    }
  }
  dragRuler.registerSystem('zweihander', zweihanderSpeedProvider);
});

Hooks.once('init', async function () {
  // CONFIG.debug.hooks = true;
  console.log(ZWEI.debugTitle);

  game.zweihander = {
    ZweihanderActor,
    ZweihanderItem,
    utils: ZweihanderUtils,
    migrations,
    rollItemMacro,
  };
  CONFIG.ChatMessage.template = 'systems/zweihander/src/templates/chat/chat-message.hbs';
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d10 + @stats.secondaryAttributes.initiative.value',
    decimals: 2,
  };
  CONFIG.TinyMCE.skin_url = 'systems/zweihander/tinymce/skins/ui/zweihander';
  CONFIG.TinyMCE.skin = 'zweihander';
  CONFIG.TinyMCE.content_css = ['/css/mce.css', 'systems/zweihander/tinymce/skins/content/zweihander/content.css'];
  CONFIG.statusEffects = ZWEI.statusEffects;
  CONFIG.ZWEI = ZWEI;
  // Define custom Document classes
  CONFIG.Actor.documentClass = ZweihanderActor;
  CONFIG.Item.documentClass = ZweihanderItem;
  CONFIG.ActiveEffect.documentClass = ZweihanderActiveEffect;
  CONFIG.ActiveEffect.legacyTransferral = false;
  // CONFIG.Combat.documentClass = ZweihanderCombat;
  // CONFIG.Combatant.documentClass = ZweihanderCombatant;
  // CONFIG.ui.combat = ZweihanderCombatTracker;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('zweihander', ZweihanderCharacterSheet, {
    types: ['character'],
    makeDefault: true,
  });
  Actors.registerSheet('zweihander', ZweihanderNpcSheet, {
    types: ['npc'],
    makeDefault: true,
  });
  Actors.registerSheet('zweihander', ZweihanderCreatureSheet, {
    types: ['creature'],
    makeDefault: true,
  });
  Actors.registerSheet('zweihander', ZweihanderVehicleSheet, {
    types: ['vehicle'],
    makeDefault: true,
  });

  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('zweihander', ZweihanderItemSheet, { makeDefault: true });

  DocumentSheetConfig.unregisterSheet(ActiveEffect, 'core', ActiveEffectConfig);
  DocumentSheetConfig.registerSheet(ActiveEffect, 'zweihader', ZweihanderActiveEffectConfig, {
    makeDefault: true,
  });
  // Register settings
  registerSystemSettings();
  // Register Helpers
  await registerHandlebarHelpers();
  // Register Templates
  return preloadHandlebarsTemplates();
});

Hooks.on('renderChatMessage', ZweihanderChat.addLocalChatListeners);
Hooks.on('renderChatLog', (app, html, data) => ZweihanderChat.addGlobalChatListeners(html));
Hooks.on('updateCompendium', async (pack, documents, options, userId) => {
  const skillPackId = game.settings.get('zweihander', 'skillPack');
  if (`${pack.metadata.package}.${pack.metadata.name}` === skillPackId) {
    ZweihanderUtils.updateActorSkillsFromPack(skillPackId);
  }
});

// Chat Commander integartion
Hooks.on('chatCommandsReady', registerChatCommands);

Hooks.once('polyglot.init', (LanguageProvider) => {
  class ZweihanderLanguageProvider extends LanguageProvider {
    getUserLanguages(actor) {
      let known_languages = new Set();
      let literate_languages = new Set();
      actor.system.languages.forEach((l) => {
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
  game.polyglot.api.registerSystem(ZweihanderLanguageProvider);
});

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag('zweihander');
});

Hooks.on('renderPause', (app, html) => {
  if (game.data.paused) {
    const doomingIndex = Math.floor(Math.random() * 100);

    html.find('img').attr('src', '../../systems/zweihander/assets/hexagram.png');

    if (game.settings.get('zweihander', 'immersivePause')) {
      html.find('figcaption').text(game.i18n.localize(`ZWEI.pauseDoomings.${doomingIndex}`));
    }
  }
});

export let _module = null;

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      _module = newModule._module;
    }
  });
}
