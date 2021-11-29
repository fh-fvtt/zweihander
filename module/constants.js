const ZWEI = {};

ZWEI.templates = {
    "skill": "systems/zweihander/templates/chat/chat-skill.hbs",
    "spell": "systems/zweihander/templates/chat/chat-spell.hbs",
    "parry": "systems/zweihander/templates/chat/chat-parry.hbs",
    "dodge": "systems/zweihander/templates/chat/chat-dodge.hbs",
    "weapon": "systems/zweihander/templates/chat/chat-weapon.hbs",
    "skillConfigurationDialog": "systems/zweihander/templates/dialog/dialog-skill-configuration.hbs",
    "spellConfigurationDialog": "systems/zweihander/templates/dialog/dialog-spell-configuration.hbs",
    "weaponConfigurationDialog": "systems/zweihander/templates/dialog/dialog-weapon-configuration.hbs"
};

ZWEI.rollTypes = {
    "skill": "skill",
    "spell": "spell",
    "parry": "parry",
    "dodge": "dodge",
    "weapon": "weapon"
};

ZWEI.testRollFormula = "1d100";

export default ZWEI;