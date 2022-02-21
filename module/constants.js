const ZWEI = {};

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

ZWEI.testRollFormula = "1d100";

export default ZWEI;