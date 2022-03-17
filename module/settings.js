import { ZWEI } from "./config";
import { updateActorSkillsFromPack } from "./utils";

export const debouncedReload = foundry.utils.debounce(() => window.location.reload(), 500);

export const registerSystemSettings = function() {
  /* -------------------------------------------- */
  /*  System settings registration                */
  /* -------------------------------------------- */


  game.settings.register("zweihander", "gameSystem", {
    name: "Game System",
    hint: "Choose the specific implementation of the Zweihander d100 system you want to play",
    scope: "world",
    type: String,
    default: 'zweihander',
    choices: ZWEI.supportedGameSystems,
    config: true,
    onChange: debouncedReload
  });

  game.settings.register("zweihander", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

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


  game.settings.register("zweihander", "openInCompactMode", {
    name: "Open in Compact Mode",
    hint: "Creature & NPC Sheets will be opened in Compact Mode by default",
    scope: "client",
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register("zweihander", "skillPack", {
    name: "Skill List",
    hint: "ID of the compendium pack to use for the list of available skills for new actors.",
    scope: "world",
    type: String,
    default: "zweihander.skills",
    config: true,
    onChange: updateActorSkillsFromPack
  });

  game.settings.register("zweihander", "theme", {
    name: "Zweihander Sheet Theme",
    hint: "Choose a theme for your Zweihander sheets",
    scope: "client",
    type: String,
    default: "gruvbox-dark",
    choices: {
      "gruvbox-dark": "Gruvbox Dark",
      "gruvbox-light": "Gruvbox Light"
    },
    config: true,
    onChange: theme => {
      $("body.system-zweihander").addClass("zweihander-theme-" + theme);
      $("body.system-zweihander").removeClass((i, c) =>
        c.split(" ").filter(c =>
          c.startsWith("zweihander-theme-") && c !== "zweihander-theme-" + theme
        )
      );
    }
  });
}