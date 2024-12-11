import { ZWEI } from './config';
import { updateActorSkillsFromPack } from './utils';
import FortuneTrackerSettings from './apps/fortune-tracker-settings';
import CurrencySettings from './apps/currency-settings';

export const debouncedReload = foundry.utils.debounce(() => window.location.reload(), 500);

export const registerSystemSettings = function () {
  /* -------------------------------------------- */
  /*  System settings registration                */
  /* -------------------------------------------- */

  game.settings.register('zweihander', 'gameSystem', {
    name: 'ZWEI.settings.gamesystem',
    hint: 'ZWEI.settings.gamesystemhint',
    scope: 'world',
    type: String,
    default: 'zweihander',
    choices: ZWEI.supportedGameSystems,
    config: true,
    onChange: debouncedReload,
  });

  game.settings.register('zweihander', 'systemMigrationVersion', {
    name: 'System Migration Version',
    scope: 'world',
    config: false,
    type: String,
    default: '',
  });

  game.settings.register('zweihander', 'migrationsRegistry', {
    name: 'Applied system migrations registry',
    scope: 'world',
    config: false,
    type: Object,
    default: {
      systemMigration: '',
      lastSystemVersion: '',
    },
  });

  game.settings.register('zweihander', 'encumbranceNineForOne', {
    name: 'ZWEI.settings.smallitem',
    hint: 'ZWEI.settings.smallitemhint',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
  });

  game.settings.register('zweihander', 'trackRewardPoints', {
    name: 'ZWEI.settings.trackreward',
    hint: 'ZWEI.settings.trackrewardhint',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
  });

  game.settings.register('zweihander', 'injuryPrompt', {
    name: 'ZWEI.settings.injuryprompt',
    hint: 'ZWEI.settings.injuryprompthint',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
  });

  game.settings.register('zweihander', 'injuryList', {
    name: 'ZWEI.settings.injurylist',
    hint: 'ZWEI.settings.injurylisthint',
    scope: 'world',
    type: String,
    default: 'zweihander.zh-gm-tables',
    config: true,
  });

  game.settings.register('zweihander', 'alternativePerilSystem', {
    scope: 'world',
    config: 'true',
    name: 'ZWEI.settings.alternativeperil',
    hint: 'ZWEI.settings.alternativeperilhint',
    type: Boolean,
    default: false,
    onChange: debouncedReload,
  });

  game.settings.register('zweihander', 'immersivePause', {
    scope: 'world',
    config: 'true',
    name: 'ZWEI.settings.immersivepause',
    hint: 'ZWEI.settings.immersivepausehint',
    type: Boolean,
    default: true,
  });

  game.settings.register('zweihander', 'unlimitedFortuneExplodes', {
    name: 'ZWEI.settings.fortuneexplodes',
    hint: 'ZWEI.settings.fortuneexplodeshint',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('zweihander', 'openInCompactMode', {
    name: 'ZWEI.settings.compactmode',
    hint: 'ZWEI.settings.compactmodehint',
    scope: 'client',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('zweihander', 'systemId', {
    name: 'systemId',
    scope: 'global',
    type: String,
    default: '',
    config: false,
  });

  game.settings.register('zweihander', 'skillPack', {
    name: 'ZWEI.settings.skilllist',
    hint: 'ZWEI.settings.skilllisthint',
    scope: 'world',
    type: String,
    default: 'zweihander.skills',
    config: true,
    onChange: updateActorSkillsFromPack,
  });

  game.settings.register('zweihander', 'theme', {
    name: 'ZWEI.settings.zweitheme',
    hint: 'ZWEI.settings.zweithemehint',
    scope: 'client',
    type: String,
    default: 'gruvbox-dark',
    choices: {
      'gruvbox-dark': 'Gruvbox Dark',
      'gruvbox-light': 'Gruvbox Light',
    },
    config: true,
    onChange: setCssTheme,
  });

  game.settings.register('zweihander', 'fortuneTrackerPersistedState', {
    scope: 'world',
    config: false,
    type: Object,
    default: {
      total: 0,
      used: 0,
      removed: 0,
    },
  });
  game.settings.register('zweihander', 'fortuneTrackerSettings', {
    scope: 'world',
    config: false,
    type: Object,
    default: {
      removeUsedMisfortune: false,
      notifications: 'notify',
      size: 'normal',
      fortunePath: '/systems/zweihander/assets/fortune-life.webp',
      misfortunePath: '/systems/zweihander/assets/fortune-death.webp',
    },
  });
  game.settings.registerMenu('zweihander', 'fortuneTrackerSettingsMenu', {
    name: 'ZWEI.settings.fortunetracker',
    label: 'ZWEI.settings.fortunetracker', // The text label used in the button
    hint: 'ZWEI.settings.fortunetrackerhint',
    icon: 'ra ra-scroll-unfurled', // A Font Awesome icon used in the submenu button
    type: FortuneTrackerSettings, // A FormApplication subclass
    restricted: true, // Restrict this submenu to gamemaster only?
  });
  game.settings.register('zweihander', 'currencySettings', {
    scope: 'world',
    config: false,
    type: Array,
    default: [
      {
        abbreviation: 'gc',
        name: 'Gold Coins',
        equivalentOfLower: 20,
        color: '#fabd2f',
      },
      {
        abbreviation: 'ss',
        name: 'Silver Shilling',
        equivalentOfLower: 12,
        color: '#928374',
      },
      {
        abbreviation: 'bp',
        name: 'Brass Pennies',
        equivalentOfLower: 0,
        color: '#d65d0e',
      },
    ],
  });
  game.settings.registerMenu('zweihander', 'currencySettingsMenu', {
    name: 'ZWEI.settings.currency',
    label: 'ZWEI.settings.currency', // The text label used in the button
    hint: 'ZWEI.settings.currencyhint',
    icon: 'fas fa-coins', // A Font Awesome icon used in the submenu button
    type: CurrencySettings, // A FormApplication subclass
    restricted: true, // Restrict this submenu to gamemaster only?
  });
};

export const setCssTheme = (theme) => {
  console.log(`zweihander | setting theme ${theme}`);
  $('body.system-zweihander').addClass('zweihander-theme-' + theme);
  $('body.system-zweihander').removeClass((i, c) =>
    c.split(' ').filter((c) => c.startsWith('zweihander-theme-') && c !== 'zweihander-theme-' + theme)
  );
};
