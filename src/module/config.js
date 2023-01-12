let ZWEI = {};

ZWEI.debugTitle =
  '\n                                                                     \\\n                Initializing                ---======================]=====O\n                                                                     /\n ________          ________ _____ _    _  _   _  _   _ _____  ______ _____  \n|___  /\\ \\        / /  ____|_   _| |  | |(_)_(_)| \\ | |  __ \\|  ____|  __ \\ \n   / /  \\ \\  /\\  / /| |__    | | | |__| |  / \\  |  \\| | |  | | |__  | |__) |\n  / /    \\ \\/  \\/ / |  __|   | | |  __  | / _ \\ | . ` | |  | |  __| |  _  / \n / /__    \\  /\\  /  | |____ _| |_| |  | |/ ___ \\| |\\  | |__| | |____| | \\ \\ \n/_____|    \\/  \\/   |______|_____|_|  |_/_/   \\_\\_| \\_|_____/|______|_|  \\_\\\n\n      /\nO=====[======================---         Grim & Perilous RPG System         \n      \\';

ZWEI.templates = {
  skill: 'systems/zweihander/src/templates/chat/chat-skill.hbs',
  spell: 'systems/zweihander/src/templates/chat/chat-spell.hbs',
  weapon: 'systems/zweihander/src/templates/chat/chat-weapon.hbs',
  skillConfigurationDialog: 'systems/zweihander/src/templates/dialog/dialog-skill-configuration.hbs',
};

ZWEI.testTypes = {
  skill: 'skill',
  spell: 'spell',
  parry: 'parry',
  dodge: 'dodge',
  weapon: 'weapon',
};

ZWEI.testModes = {
  standard: {
    label: 'Standard',
    rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
  },
  assisted: {
    label: 'Assisted',
    rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
  },
  opposed: {
    label: 'Opposed',
    rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
  },
  private: {
    label: 'Private',
    help: 'Visible for GM & you',
    rollMode: CONST.DICE_ROLL_MODES.PRIVATE,
  },
  secret: {
    label: 'Secret',
    help: 'Visible for GM',
    rollMode: CONST.DICE_ROLL_MODES.BLIND,
  },
  secretopposed: {
    label: 'Secret Opposed',
    help: 'Visible for GM',
    rollMode: CONST.DICE_ROLL_MODES.BLIND,
  },
  self: {
    label: 'Self',
    help: 'Visible for you',
    rollMode: CONST.DICE_ROLL_MODES.SELF,
  },
};

ZWEI.alignmentRanks = 9;
ZWEI.perilOptions = [
  'incapacitated',
  'ignore3',
  'ignore2',
  'ignore1',
  'imperiled',
  'unhindered',
];
ZWEI.damageOptions = [
  'slain',
  'grievously',
  'seriously',
  'moderately',
  'lightly',
  'unharmed',
];
ZWEI.tiers = {
  1: 'Basic',
  2: 'Intermediate',
  3: 'Advanced',
};
ZWEI.tiersInversed = {
  Basic: 1,
  Intermediate: 2,
  Advanced: 3,
};

ZWEI.primaryAttributes = ['combat', 'brawn', 'agility', 'perception', 'intelligence', 'willpower', 'fellowship'];

ZWEI.primaryAttributeIcons = {
  combat: 'ra ra-croc-sword',
  brawn: 'ra ra-muscle-up',
  agility: 'fa fa-running',
  perception: 'ra ra-aware',
  intelligence: 'ra ra-book',
  willpower: 'ra ra-crystal-ball',
  fellowship: 'ra ra-double-team',
};

ZWEI.supportedGameSystems = {
  zweihander: 'Zweihander',
  fof: 'Flames of Freedom',
};

ZWEI.replacedDefaultCoreIcons = ['icons/svg/mystery-man.svg', 'icons/svg/item-bag.svg'];

const d = 'systems/zweihander/assets/icons';
ZWEI.defaultItemIcons = {
  _default: `${d}/swap-bag.svg`,
  trapping: `${d}/swap-bag.svg`,
  condition: `${d}/abstract-024.svg`,
  injury: `${d}/bandaged.svg`,
  disease: `${d}/half-dead.svg`,
  disorder: `${d}/abstract-057.svg`,
  profession: `${d}/abstract-082.svg`,
  ancestry: `${d}/dna2.svg`,
  armor: `${d}/leather-armor.svg`,
  weapon: `${d}/sword-hilt.svg`,
  spell: `${d}/wizard-staff.svg`,
  ritual: `${d}/pentacle.svg`,
  talent: `${d}/fist.svg`,
  trait: `${d}/vitruvian-man.svg`,
  drawback: `${d}/spiked-halo.svg`,
  quality: `${d}/flint-spark.svg`,
  skill: `${d}/skills.svg`,
  uniqueAdvance: `${d}/card-joker.svg`,
  taint: `${d}/evil-moon.svg`,
};

ZWEI.defaultActorIcons = {
  _default: `${d}/cowled.svg`,
  character: `${d}/character.svg`,
  creature: `${d}/daemon-skull.svg`,
  npc: `${d}/cowled.svg`,
};

ZWEI.packSets = {
  zweihander: {
    base: {
      ancestry: 'zweihander.zh-ancestries',
      armor: 'zweihander.zh-armor',
      condition: 'zweihander.zh-conditions',
      disease: 'zweihander.zh-diseases',
      disorder: 'zweihander.zh-disorders',
      drawback: 'zweihander.zh-drawbacks',
      injury: 'zweihander.zh-injuries',
      profession: 'zweihander.zh-professions',
      ritual: 'zweihander.zh-rituals',
      spell: 'zweihander.zh-magick',
      taint: 'zweihander.zh-taints',
      talent: 'zweihander.zh-talents',
      trait: 'zweihander.zh-traits',
      trapping: 'zweihander.zh-trappings',
      weapon: 'zweihander.zh-weapons, zweihander.zh-weapons-alt-damage',
    },
    creature: {
      trait: 'zweihander.zh-creature-traits',
    },
    npc: {
      trait: 'zweihander.zh-creature-traits, zweihander.zh-ancestral-traits',
    },
    character: {
      trait: 'zweihander.zh-ancestral-traits',
    },
  },
  fof: {
    base: {
      disease: 'zweihander.fof-ailments-and-drugs',
      disorder: 'zweihander.fof-afflictions',
      drawback: 'zweihander.fof-quirks',
      injury: 'zweihander.fof-injuries',
      profession: 'zweihander.fof-professions',
      spell: 'zweihander.fof-spells',
      talent: 'zweihander.fof-talents',
      trait: 'zweihander.fof-traits, zweihander.fof-professional-traits',
      weapon: 'zweihander.fof-weapons',
    },
    creature: {
      trait: 'zweihander.zh-creature-traits',
    },
    npc: {
      trait: 'zweihander.zh-creature-traits',
    },
  },
};

ZWEI.archetypes = ['Academic', 'Commoner', 'Knave', 'Ranger', 'Socialite', 'Warrior', 'Expert Profession'];

ZWEI.injurySeverities = [
  { value: 0, label: 'Moderate' },
  { value: 1, label: 'Serious' },
  { value: 2, label: 'Grievous' },
];

ZWEI.statusEffects = [
  {
    id: 'dead',
    label: 'EFFECT.StatusDead',
    icon: 'systems/zweihander/assets/icons/death-skull.svg',
  },
  {
    id: 'blind',
    label: 'EFFECT.StatusBlind',
    icon: 'systems/zweihander/assets/icons/sight-disabled.svg',
  },
  {
    id: 'choke',
    label: 'EFFECT.StatusChoked',
    icon: 'systems/zweihander/assets/icons/slipknot.svg',
  },
  {
    id: 'defenseless',
    label: 'EFFECT.StatusDefenseless',
    icon: 'systems/zweihander/assets/icons/broken-shield.svg',
  },
  {
    id: 'disarmed',
    label: 'EFFECT.StatusDisarmed',
    icon: 'systems/zweihander/assets/icons/sword-break.svg',
  },
  {
    id: 'helpless',
    label: 'EFFECT.StatusHelpless',
    icon: 'systems/zweihander/assets/icons/handcuffed.svg',
  },
  {
    id: 'inspired',
    label: 'EFFECT.StatusInspired',
    icon: 'systems/zweihander/assets/icons/armor-upgrade.svg',
  },
  {
    id: 'intimidated',
    label: 'EFFECT.StatusIntimidated',
    icon: 'systems/zweihander/assets/icons/armor-downgrade.svg',
  },
  {
    id: 'knocked',
    label: 'EFFECT.StatusKnockedOut',
    icon: 'systems/zweihander/assets/icons/knockout.svg',
  },
  {
    id: 'prone',
    label: 'EFFECT.StatusProne',
    icon: 'systems/zweihander/assets/icons/falling.svg',
  },
  {
    id: 'stun',
    label: 'EFFECT.StatusStunned',
    icon: 'systems/zweihander/assets/icons/stoned-skull.svg',
  },
  {
    id: 'surprised',
    label: 'EFFECT.StatusSurprised',
    icon: 'systems/zweihander/assets/icons/surprised.svg',
  },
  {
    id: 'burning',
    label: 'EFFECT.StatusBurning',
    icon: 'systems/zweihander/assets/icons/flame.svg',
  },
  {
    id: 'bleeding',
    label: 'EFFECT.StatusBleeding',
    icon: 'systems/zweihander/assets/icons/bleeding-wound.svg',
  },
];

export { ZWEI };

// this exact if statement guarantees vite will tree-shake this out in prod
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    ZWEI = newModule.ZWEI;
  });
}
