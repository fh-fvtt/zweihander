let ZWEI = {};

ZWEI.debugTitle =
  '\n                                                                     \\\n                Initializing                ---======================]=====O\n                                                                     /\n ________          ________ _____ _    _  _   _  _   _ _____  ______ _____  \n|___  /\\ \\        / /  ____|_   _| |  | |(_)_(_)| \\ | |  __ \\|  ____|  __ \\ \n   / /  \\ \\  /\\  / /| |__    | | | |__| |  / \\  |  \\| | |  | | |__  | |__) |\n  / /    \\ \\/  \\/ / |  __|   | | |  __  | / _ \\ | . ` | |  | |  __| |  _  / \n / /__    \\  /\\  /  | |____ _| |_| |  | |/ ___ \\| |\\  | |__| | |____| | \\ \\ \n/_____|    \\/  \\/   |______|_____|_|  |_/_/   \\_\\_| \\_|_____/|______|_|  \\_\\\n\n      /\nO=====[======================---         Grim & Perilous RPG System         \n      \\';

ZWEI.templates = {
  skill: 'systems/zweihander/src/templates/chat/chat-skill.hbs',
  spell: 'systems/zweihander/src/templates/chat/chat-spell.hbs',
  weapon: 'systems/zweihander/src/templates/chat/chat-weapon.hbs',
  madness: 'systems/zweihander/src/templates/chat/chat-madness.hbs',
  skillConfigurationDialog: 'systems/zweihander/src/templates/dialog/dialog-skill-configuration.hbs',
};

ZWEI.testTypes = {
  skill: 'skill',
  spell: 'spell',
  parry: 'parry',
  dodge: 'dodge',
  weapon: 'weapon',
  madness: 'madness',
};

ZWEI.testModes = {
  standard: {
    label: 'Standard',
  },
  assisted: {
    label: 'Assisted',
  },
  opposed: {
    label: 'Opposed',
  },
  /*
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
  */
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

ZWEI.traitCategories = ['professional', 'special', 'ancestral', 'creature'];

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

ZWEI.primaryAttributePhases = {
  'system.stats.primaryAttributes.combat.value': 'initial',
  'system.stats.primaryAttributes.brawn.value': 'initial',
  'system.stats.primaryAttributes.agility.value': 'initial',
  'system.stats.primaryAttributes.perception.value': 'initial',
  'system.stats.primaryAttributes.intelligence.value': 'initial',
  'system.stats.primaryAttributes.willpower.value': 'initial',
  'system.stats.primaryAttributes.fellowship.value': 'initial',
};

ZWEI.primaryAttributeBonusPhases = {
  'system.stats.primaryAttributes.combat.bonus': 'intermediate',
  'system.stats.primaryAttributes.brawn.bonus': 'intermediate',
  'system.stats.primaryAttributes.agility.bonus': 'intermediate',
  'system.stats.primaryAttributes.perception.bonus': 'intermediate',
  'system.stats.primaryAttributes.intelligence.bonus': 'intermediate',
  'system.stats.primaryAttributes.willpower.bonus': 'intermediate',
  'system.stats.primaryAttributes.fellowship.bonus': 'intermediate',
};

ZWEI.secondaryAttributePhases = {
  'system.stats.secondaryAttributes.damageThreshold.value': 'advanced',
  'system.stats.secondaryAttributes.perilThreshold.value': 'advanced',
  //'system.stats.secondaryAttributes.dodge.value': 'advanced',
  //'system.stats.secondaryAttributes.parry.value': 'advanced',
  //'system.stats.secondaryAttributes.magick.value': 'advanced',
  'system.stats.secondaryAttributes.encumbrance.value': 'advanced',
  'system.stats.secondaryAttributes.initiative.value': 'advanced',
  'system.stats.secondaryAttributes.movement.value': 'advanced',
};

ZWEI.typeOperator = {
  add: '+',
  subtract: '-',
  multiply: '*',
  override: ':=',
  upgrade: '↑',
  downgrade: '↓',
};

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

ZWEI.statusEffects = {
  dead: {
    name: 'EFFECT.dead',
    img: 'systems/zweihander/assets/default-icons/death-skull.svg',
  },
  blinded: {
    name: 'EFFECT.blinded',
    img: 'systems/zweihander/assets/default-icons/blindfold.svg',
  },
  choked: {
    name: 'EFFECT.choked',
    img: 'systems/zweihander/assets/default-icons/slipknot.svg',
  },
  defenseless: {
    name: 'EFFECT.defenseless',
    img: 'systems/zweihander/assets/default-icons/broken-axe.svg',
  },
  disarmed: {
    name: 'EFFECT.disarmed',
    img: 'systems/zweihander/assets/default-icons/drop-weapon.svg',
  },
  helpless: {
    name: 'EFFECT.helpless',
    img: 'systems/zweihander/assets/default-icons/half-body-crawling.svg',
  },
  inspired: {
    name: 'EFFECT.inspired',
    img: 'systems/zweihander/assets/default-icons/trumpet-flag.svg',
    changes: [
      {
        key: 'system.stats.secondaryAttributes.damageThreshold.value',
        phase: 'advanced',
        priority: null,
        type: 'add',
        value: 1,
      },
      {
        key: 'system.stats.secondaryAttributes.perilThreshold.value',
        phase: 'advanced',
        priority: null,
        type: 'add',
        value: 1,
      },
    ],
    duration: {
      expiry: 'combatEnd',
    },
  },
  intimidated: {
    name: 'EFFECT.intimidated',
    img: 'systems/zweihander/assets/default-icons/dark-squad.svg',
    changes: [
      {
        key: 'system.stats.secondaryAttributes.damageThreshold.value',
        phase: 'advanced',
        priority: null,
        type: 'subtract',
        value: 1,
      },
      {
        key: 'system.stats.secondaryAttributes.perilThreshold.value',
        phase: 'advanced',
        priority: null,
        type: 'subtract',
        value: 1,
      },
    ],
    duration: {
      expiry: 'combatEnd',
    },
  },
  knockedOut: {
    name: 'EFFECT.knockedout',
    img: 'systems/zweihander/assets/default-icons/knockout.svg',
  },
  prone: {
    name: 'EFFECT.prone',
    img: 'systems/zweihander/assets/default-icons/back-pain.svg',
  },
  stunned: {
    name: 'EFFECT.stunned',
    img: 'systems/zweihander/assets/default-icons/knocked-out-stars.svg',
  },
  surprised: {
    name: 'EFFECT.surprised',
    img: 'systems/zweihander/assets/default-icons/surprised.svg',
  },
  onFire: {
    name: 'EFFECT.onfire',
    img: 'systems/zweihander/assets/default-icons/wildfires.svg',
  },
  bleeding: {
    name: 'EFFECT.bleeding',
    img: 'systems/zweihander/assets/default-icons/ragged-wound.svg',
  },
  incapacitated: {
    name: 'EFFECT.incapacitated',
    img: 'systems/zweihander/assets/default-icons/despair.svg',
  },
  intoxicated: {
    name: 'EFFECT.intoxicated',
    img: 'systems/zweihander/assets/default-icons/drinking.svg',
    changes: [
      {
        key: 'system.stats.secondaryAttributes.damageThreshold.value',
        phase: 'advanced',
        priority: null,
        type: 'add',
        value: 3,
      },
    ],
    duration: {
      value: 6,
      units: 'hours',
      expiry: null,
    },
  },
  delirious: {
    name: 'EFFECT.delirious',
    img: 'systems/zweihander/assets/default-icons/six-eyes.svg',
  },
  poisoned: {
    name: 'EFFECT.poisoned',
    img: 'systems/zweihander/assets/default-icons/mushroom.svg',
  },
  envenomed: {
    name: 'EFFECT.envenomed',
    img: 'systems/zweihander/assets/default-icons/scorpion.svg',
  },
  exhausted: {
    name: 'EFFECT.exhausted',
    img: 'systems/zweihander/assets/default-icons/tired-eye.svg',
  },
  starving: {
    name: 'EFFECT.starving',
    img: 'systems/zweihander/assets/default-icons/fish-corpse.svg',
  },
  suffocating: {
    name: 'EFFECT.suffocating',
    img: 'systems/zweihander/assets/default-icons/drowning.svg',
  },
  confused: {
    name: 'EFFECT.confused',
    img: 'systems/zweihander/assets/default-icons/misdirection.svg',
  },
};

export { ZWEI };

// this exact if statement guarantees vite will tree-shake this out in prod
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    ZWEI = newModule.ZWEI;
  });
}
