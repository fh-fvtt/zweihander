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
ZWEI.rankOptions = { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9" };
ZWEI.perilOptions = { 5: "Unhindered", 4: "Imperiled", 3: "Ignore 1 Skill Rank", 2: "Ignore 2 Skill Ranks", 1: "Ignore 3 Skill Ranks", 0: "INCAPACITATED!" };
ZWEI.damageOptions = { 5: "Unharmed", 4: "Lightly Wounded", 3: "Moderately Wounded", 2: "Seriously Wounded", 1: "Grievously Wounded", 0: "SLAIN!" };
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