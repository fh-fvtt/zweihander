export const ZWEI = {};

ZWEI.templates = {
    "skill": "systems/zweihander/templates/chat/chat-skill.hbs",
    "spell": "systems/zweihander/templates/chat/chat-spell.hbs",
    "weapon": "systems/zweihander/templates/chat/chat-weapon.hbs",
    "skillConfigurationDialog": "systems/zweihander/templates/dialog/dialog-skill-configuration.hbs"
};

ZWEI.testTypes = {
    "skill": "skill",
    "spell": "spell",
    "parry": "parry",
    "dodge": "dodge",
    "weapon": "weapon"
};
ZWEI.alignmentRanks = 9;
ZWEI.perilOptions = [
    "INCAPACITATED!",
    "Ignore 3 Skill Ranks",
    "Ignore 2 Skill Ranks",
    "Ignore 1 Skill Rank",
    "Imperiled",
    "Unhindered"
];
ZWEI.damageOptions = [
    "SLAIN!",
    "Grievously Wounded",
    "Seriously Wounded",
    "Moderately Wounded",
    "Lightly Wounded",
    "Unharmed"
];
ZWEI.tiers = {
    1: "Basic",
    2: "Intermediate",
    3: "Advanced"
}
ZWEI.tiersInversed = {
    Basic: 1,
    Intermediate: 2,
    Advanced: 3
}

ZWEI.primaryAttributes = [
    "combat",
    "brawn",
    "agility",
    "perception",
    "intelligence",
    "willpower",
    "fellowship"
]

ZWEI.primaryAttributeIcons = {
    "combat": "ra ra-croc-sword",
    "brawn": "ra ra-muscle-up",
    "agility": "fa fa-running",
    "perception": "ra ra-aware",
    "intelligence": "ra ra-book",
    "willpower": "ra ra-crystal-ball",
    "fellowship": "ra ra-double-team"
}

ZWEI.supportedGameSystems = {
    zweihander: "Zweihander",
    fof: "Flames of Freedom"
}

const d = "/systems/zweihander/assets/icons";
ZWEI.defaultItemIcons = {
    "trapping": `${d}/swap-bag.svg`,
    "condition": `${d}/abstract-024.svg`,
    "injury": `${d}/bandaged.svg`,
    "disease": `${d}/half-dead.svg`,
    "disorder": `${d}/abstract-057.svg`,
    "profession": `${d}/abstract-082.svg`,
    "ancestry": `${d}/dna2.svg`,
    "armor": `${d}/leather-armor.svg`,
    "weapon": `${d}/sword-hilt.svg`,
    "spell": `${d}/wizard-staff.svg`,
    "ritual": `${d}/pentacle.svg`,
    "talent": `${d}/fist.svg`,
    "trait": `${d}/vitruvian-man.svg`,
    "drawback": `${d}/spiked-halo.svg`,
    "quality": `${d}/flint-spark.svg`,
    "skill": `${d}/skills.svg`,
    "uniqueAdvance": `${d}/card-joker.svg`,
    "taint": `${d}/evil-moon.svg`
};
ZWEI.defaultActorIcons = {
    "character": `${d}/character.svg`,
    "creature": `${d}/daemon-skull.svg`,
    "npc": `${d}/cowled.svg`,
};
