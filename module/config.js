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

ZWEI.testModes = {
    "standard": {
        label: "Standard",
        rollMode: CONST.DICE_ROLL_MODES.PUBLIC
    },
    "assisted": {
        label: "Assisted",
        rollMode: CONST.DICE_ROLL_MODES.PUBLIC
    },
    "opposed": {
        label: "Opposed",
        rollMode: CONST.DICE_ROLL_MODES.PUBLIC
    },
    "private": {
        label: "Private",
        help: "Visible for GM & you",
        rollMode: CONST.DICE_ROLL_MODES.PRIVATE
    },
    "secret": {
        label: "Secret",
        help: "Visible for GM",
        rollMode: CONST.DICE_ROLL_MODES.BLIND
    },
    "secret-opposed": {
        label: "Secret Opposed",
        help: "Visible for GM",
        rollMode: CONST.DICE_ROLL_MODES.BLIND
    },
    "self": {
        label: "Self",
        help: "Visible for you",
        rollMode: CONST.DICE_ROLL_MODES.SELF
    }
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

ZWEI.replacedDefaultCoreIcons = [
    'icons/svg/mystery-man.svg',
    'icons/svg/item-bag.svg'
];

const d = "/systems/zweihander/assets/icons";
ZWEI.defaultItemIcons = {
    "_default": `${d}/swap-bag.svg`,
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
    "_default": `${d}/cowled.svg`,
    "character": `${d}/character.svg`,
    "creature": `${d}/daemon-skull.svg`,
    "npc": `${d}/cowled.svg`,
};

ZWEI.packSets = {
    zweihander: {
        base: {
            ancestry: "zweihander.zh-ancestries",
            armor: "zweihander.zh-armor",
            condition: "zweihander.zh-conditions",
            disease: "zweihander.zh-diseases",
            disorder: "zweihander.zh-disorders",
            drawback: "zweihander.zh-drawbacks",
            injury: "zweihander.zh-injuries",
            profession: "zweihander.zh-professions",
            ritual: "zweihander.zh-rituals",
            spell: "zweihander.zh-magick",
            taint: "zweihander.zh-taints",
            talent: "zweihander.zh-talents",
            trait: "zweihander.zh-traits",
            trapping: "zweihander.zh-trappings",
            weapon: "zweihander.zh-weapons, zweihander.zh-weapons-alt-damage",
        },
        creature: {
            trait: "zweihander.zh-creature-traits"
        },
        npc: {
            trait: "zweihander.zh-creature-traits, zweihander.zh-ancestral-traits"
        },
        character: {
            trait: "zweihander.zh-ancestral-traits"
        }
    },
    fof: {
        base: {
            disease: "zweihander.fof-ailments-and-drugs",
            disorder: "zweihander.fof-afflictions",
            drawback: "zweihander.fof-quirks",
            injury: "zweihander.fof-injuries",
            profession: "zweihander.fof-professions",
            spell: "zweihander.fof-spells",
            talent: "zweihander.fof-talents",
            trait: "zweihander.fof-traits, zweihander.fof-professional-traits",
            weapon: "zweihander.fof-weapons",
        },
        creature: {
            trait: "zweihander.zh-creature-traits"
        },
        npc: {
            trait: "zweihander.zh-creature-traits"
        },
    }
}