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
ZWEI.perilOptions = ['incapacitated', 'ignore3', 'ignore2', 'ignore1', 'imperiled', 'unhindered'];
ZWEI.altPerilOptions = ['incapacitated', 'penalty20', 'penalty10', 'penalty5', 'imperiled', 'unhindered'];
ZWEI.damageOptions = ['slain', 'grievously', 'seriously', 'moderately', 'lightly', 'unharmed'];
ZWEI.vehicleDamageOptions = ['wrecked', 'gSmashed', 'sSmashed', 'mSmashed', 'lSmashed', 'fixed'];
ZWEI.tiers = {
  1: 'basic',
  2: 'intermediate',
  3: 'advanced',
};

ZWEI.alternativePerilTable = {
  5: 0,
  4: 0,
  3: -5,
  2: -10,
  1: -15,
  0: -20,
};

ZWEI.ritualDifficultyGeneric = ['varies', 'special'];

ZWEI.primaryAttributes = ['combat', 'brawn', 'agility', 'perception', 'intelligence', 'willpower', 'fellowship'];
ZWEI.primaryAttributeBonuses = ['CB', 'BB', 'AB', 'PB', 'IB', 'WB', 'FB'];

// @todo: uncomment when Active Effects can affect Skill Tests
ZWEI.secondaryAttributes = [
  'damageThreshold',
  'perilThreshold',
  //'dodge',
  //'parry',
  //'magick',
  'encumbrance',
  'initiative',
  'movement',
];

ZWEI.primaryAttributeKeys = [
  'system.stats.primaryAttributes.combat.value',
  'system.stats.primaryAttributes.brawn.value',
  'system.stats.primaryAttributes.agility.value',
  'system.stats.primaryAttributes.perception.value',
  'system.stats.primaryAttributes.intelligence.value',
  'system.stats.primaryAttributes.willpower.value',
  'system.stats.primaryAttributes.fellowship.value',
];

ZWEI.primaryAttributeBonusKeys = [
  'system.stats.primaryAttributes.combat.bonus',
  'system.stats.primaryAttributes.brawn.bonus',
  'system.stats.primaryAttributes.agility.bonus',
  'system.stats.primaryAttributes.perception.bonus',
  'system.stats.primaryAttributes.intelligence.bonus',
  'system.stats.primaryAttributes.willpower.bonus',
  'system.stats.primaryAttributes.fellowship.bonus',
];

ZWEI.secondaryAttributeKeys = [
  'system.stats.secondaryAttributes.damageThreshold.value',
  'system.stats.secondaryAttributes.perilThreshold.value',
  //'system.stats.secondaryAttributes.dodge.value',
  //'system.stats.secondaryAttributes.parry.value',
  //'system.stats.secondaryAttributes.magick.value',
  'system.stats.secondaryAttributes.encumbrance.value',
  'system.stats.secondaryAttributes.initiative.value',
  'system.stats.secondaryAttributes.movement.value',
];

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

const d = 'systems/zweihander/assets/default-icons';
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
  vehicle: `${d}/cartwheel.svg`,
  npc: `${d}/cowled.svg`,
};

ZWEI.archetypes = ['Academic', 'Commoner', 'Knave', 'Ranger', 'Socialite', 'Warrior'];

ZWEI.injurySeverities = [
  { value: 0, label: 'moderate' },
  { value: 1, label: 'serious' },
  { value: 2, label: 'grievous' },
];

ZWEI.statusEffects = [
  {
    id: 'dead',
    name: 'EFFECT.dead',
    icon: 'systems/zweihander/assets/icons/death-skull.svg',
  },
  {
    id: 'blind',
    name: 'EFFECT.blind',
    icon: 'systems/zweihander/assets/icons/sight-disabled.svg',
  },
  {
    id: 'choke',
    name: 'EFFECT.choked',
    icon: 'systems/zweihander/assets/icons/slipknot.svg',
  },
  {
    id: 'defenseless',
    name: 'EFFECT.defenseless',
    icon: 'systems/zweihander/assets/icons/broken-shield.svg',
  },
  {
    id: 'disarmed',
    name: 'EFFECT.disarmed',
    icon: 'systems/zweihander/assets/icons/sword-break.svg',
  },
  {
    id: 'helpless',
    name: 'EFFECT.helpless',
    icon: 'systems/zweihander/assets/icons/handcuffed.svg',
  },
  {
    id: 'inspired',
    name: 'EFFECT.inspired',
    icon: 'systems/zweihander/assets/icons/armor-upgrade.svg',
  },
  {
    id: 'intimidated',
    name: 'EFFECT.intimidated',
    icon: 'systems/zweihander/assets/icons/armor-downgrade.svg',
  },
  {
    id: 'knocked',
    name: 'EFFECT.knockedOut',
    icon: 'systems/zweihander/assets/icons/knockout.svg',
  },
  {
    id: 'prone',
    name: 'EFFECT.prone',
    icon: 'systems/zweihander/assets/icons/falling.svg',
  },
  {
    id: 'stun',
    name: 'EFFECT.stunned',
    icon: 'systems/zweihander/assets/icons/stoned-skull.svg',
  },
  {
    id: 'surprised',
    name: 'EFFECT.surprised',
    icon: 'systems/zweihander/assets/icons/surprised.svg',
  },
  {
    id: 'burning',
    name: 'EFFECT.burning',
    icon: 'systems/zweihander/assets/icons/flame.svg',
  },
  {
    id: 'bleeding',
    name: 'EFFECT.bleeding',
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
