/**
 * An implementation of the Zweihänder Grim & Perilous RPG system for FoundryVTT
 * Authors: Re4XN, kxfin
 */

import '../index.scss';

import * as ZweihanderUtils from './system/utils';
import * as ZweihanderChat from './system/chat';

import ZweihanderGamePause from './apps/pause';
import ZweihanderPlayerCharacterModel from './model/actor/pc-model';
import ZweihanderCreatureModel from './model/actor/creature-model';
import ZweihanderNpcModel from './model/actor/npc-model';
import ZweihanderVehicleModel from './model/actor/vehicle-model';
import ZweihanderActor from './documents/actor/actor';
import ZweihanderActiveEffect from './documents/effects/active-effect';
import ZweihanderActiveEffectConfig from './apps/active-effect-config';
import ZweihanderCharacterSheet from './sheets/actor/character-sheet';
import ZweihanderNpcSheet from './sheets/actor/npc-sheet';
import ZweihanderCreatureSheet from './sheets/actor/creature-sheet';
import ZweihanderVehicleSheet from './sheets/actor/vehicle-sheet';
import ZweihanderItem from './documents/item/item';
import ZweihanderItemSheet from './sheets/item/item-sheet';
import ZweihanderAncestryModel from './model/item/ancestry-model';
import ZweihanderArmorModel from './model/item/armor-model';
import ZweihanderConditionModel from './model/item/condition-model';
import ZweihanderDiseaseModel from './model/item/disease-model';
import ZweihanderDisorderModel from './model/item/disorder-model';
import ZweihanderDrawbackModel from './model/item/drawback-model';
import ZweihanderInjuryModel from './model/item/injury-model';
import ZweihanderProfessionModel from './model/item/profession-model';
import ZweihanderQualityModel from './model/item/quality-model';
import ZweihanderRitualModel from './model/item/ritual-model';
import ZweihanderSkillModel from './model/item/skill-model';
import ZweihanderSpellModel from './model/item/spell-model';
import ZweihanderTaintModel from './model/item/taint-model';
import ZweihanderTalentModel from './model/item/talent-model';
import ZweihanderTraitModel from './model/item/trait-model';
import ZweihanderTrappingModel from './model/item/trapping-model';
import ZweihanderUniqueAdvanceModel from './model/item/unique-advance-model';
import ZweihanderWeaponModel from './model/item/weapon-model';
import ZweihanderActiveEffectModel from './model/effect/active-effect-model';
import FortuneTracker from './apps/fortune-tracker';

import { ZWEI } from './system/config';
import { registerChatCommands } from './misc/chat-commands';
import { registerSystemSettings, registerCompendiumSettings, setCssTheme } from './system/settings';
import { renderSettings } from './system/sidebar';
import { preloadHandlebarsTemplates } from './misc/templates';
import { registerHandlebarHelpers } from './misc/helpers';
import { patchDie } from './system/rolls/dice';
import { createItemMacro, rollItemMacro } from './system/macros';
import { performWorldMigrations, migrations } from './misc/migration';
import { HTMLZweihanderTagsElement } from './components/zweihander-tags';
import { HTMLZweihanderMultiSelectElement } from './components/zweihander-multiselect';
import { HTMLZweihanderRepeatMultiSelectElement } from './components/zweihander-repeat-multiselect';

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

CONFIG.compatibility.mode = CONST.COMPATIBILITY_MODES.SILENT;

window.customElements.define(HTMLZweihanderTagsElement.tagName, HTMLZweihanderTagsElement);
window.customElements.define(HTMLZweihanderMultiSelectElement.tagName, HTMLZweihanderMultiSelectElement);
window.customElements.define(HTMLZweihanderRepeatMultiSelectElement.tagName, HTMLZweihanderRepeatMultiSelectElement);

globalThis.findItemWorldWide = (type, name) => ZweihanderUtils.findItemWorldWide(type, name);
globalThis.findItemsWorldWide = (type, names) => ZweihanderUtils.findItemsWorldWide(type, names);

const socket = new Promise((resolve) => {
  Hooks.once('socketlib.ready', () => {
    console.log();
    resolve(socketlib.registerSystem('zweihander'));
  });
});

Hooks.once('ready', function () {
  // register compendium settings
  registerCompendiumSettings();

  // this is necessary to apply the theme settings
  let sheetStyles = game.settings.get('zweihander', 'theme');
  setCssTheme(sheetStyles);

  performWorldMigrations();
  socket.then((socket) => {
    game.zweihander.socket = socket;
    FortuneTracker.INSTANCE = new FortuneTracker(socket);
    FortuneTracker.INSTANCE?.syncState();
    socket.register('updateChatMessage', async (messageId, diffData) => {
      await game.messages.get(messageId).update(diffData);
    });
  });

  // Monkey-Patch Search Filter
  const cleanQuery = SearchFilter.cleanQuery;
  SearchFilter.cleanQuery = (x) => ZweihanderUtils.removeDiacritics(cleanQuery(x));

  // patch die class
  patchDie();

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

Hooks.once('init', async function () {
  //CONFIG.debug.hooks = true;

  console.log(ZWEI.debugTitle);

  // Register settings
  registerSystemSettings();

  game.zweihander = {
    ZweihanderActor,
    ZweihanderItem,
    utils: ZweihanderUtils,
    migrations,
    rollItemMacro,
  };

  Object.assign(CONFIG.ActiveEffect.phases, {
    intermediate: {
      hint: '',
      label: 'Intermediate',
    },
    advanced: {
      hint: '',
      label: 'Advanced',
    },
  });

  Object.assign(CONFIG.ActiveEffect.dataModels, {
    base: ZweihanderActiveEffectModel,
  });

  Object.assign(CONFIG.Actor.dataModels, {
    character: ZweihanderPlayerCharacterModel,
    creature: ZweihanderCreatureModel,
    npc: ZweihanderNpcModel,
    vehicle: ZweihanderVehicleModel,
  });

  Object.assign(CONFIG.Item.dataModels, {
    ancestry: ZweihanderAncestryModel,
    armor: ZweihanderArmorModel,
    condition: ZweihanderConditionModel,
    disease: ZweihanderDiseaseModel,
    disorder: ZweihanderDisorderModel,
    drawback: ZweihanderDrawbackModel,
    injury: ZweihanderInjuryModel,
    profession: ZweihanderProfessionModel,
    quality: ZweihanderQualityModel,
    ritual: ZweihanderRitualModel,
    skill: ZweihanderSkillModel,
    spell: ZweihanderSpellModel,
    taint: ZweihanderTaintModel,
    talent: ZweihanderTalentModel,
    trait: ZweihanderTraitModel,
    trapping: ZweihanderTrappingModel,
    uniqueAdvance: ZweihanderUniqueAdvanceModel,
    weapon: ZweihanderWeaponModel,
  });

  CONFIG.ChatMessage.template = 'systems/zweihander/src/templates/chat/chat-message.hbs';
  Roll.CHAT_TEMPLATE = 'systems/zweihander/src/templates/dice/roll.hbs';

  const initiativeFormula = game.settings.get('zweihander', 'initiativeFormula');

  CONFIG.Combat.initiative = {
    formula: initiativeFormula,
    decimals: 2,
  };

  // CONFIG.debug.hooks = true;

  for (const status of Object.keys(CONFIG.statusEffects)) delete CONFIG.statusEffects[status];

  for (const [id, value] of Object.entries(ZWEI.statusEffects)) CONFIG.statusEffects[id] = { id, ...value };

  CONFIG.ZWEI = ZWEI;
  // Define custom Document classes
  CONFIG.Actor.documentClass = ZweihanderActor;
  CONFIG.Item.documentClass = ZweihanderItem;
  CONFIG.ActiveEffect.documentClass = ZweihanderActiveEffect;
  CONFIG.ActiveEffect.legacyTransferral = false;
  CONFIG.ui.pause = ZweihanderGamePause;
  // CONFIG.Combat.documentClass = ZweihanderCombat;
  // CONFIG.Combatant.documentClass = ZweihanderCombatant;
  // CONFIG.ui.combat = ZweihanderCombatTracker;

  // Register sheet application classes
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

  Items.registerSheet('zweihander', ZweihanderItemSheet, { makeDefault: true });

  DocumentSheetConfig.registerSheet(ActiveEffect, 'zweihander', ZweihanderActiveEffectConfig, {
    makeDefault: true,
  });

  // Register Helpers
  await registerHandlebarHelpers();
  // Register Templates
  return preloadHandlebarsTemplates();
});

Hooks.on('renderChatMessageHTML', ZweihanderChat.addLocalChatListeners);
Hooks.on('renderChatLog', (app, html, data) => ZweihanderChat.addGlobalChatListeners(html));
Hooks.on('renderSettings', (app, html) => renderSettings(html));
Hooks.on('updateCompendium', async (pack, documents, options, userId) => {
  const skillPackId = game.settings.get('zweihander', 'skillPack');
  if (`${pack.metadata.package}.${pack.metadata.name}` === skillPackId) {
    ZweihanderUtils.updateActorSkillsFromPack(skillPackId);
  }
});
Hooks.on('getChatMessageContextOptions', (application, menuItems) => {
  // @todo: add context menu options here
  // console.log('STUFF:', application, menuItems);
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

export let _module = null;

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      _module = newModule._module;
    }
  });
}
