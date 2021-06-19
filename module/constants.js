const ZWEI = {};

ZWEI.templates = {
    "skill": "systems/zweihander/templates/chat/chat-skill.html",
    "spell": "systems/zweihander/templates/chat/chat-spell.html",
    "parry": "systems/zweihander/templates/chat/chat-parry.html",
    "dodge": "systems/zweihander/templates/chat/chat-dodge.html",
    "weapon": "systems/zweihander/templates/chat/chat-weapon.html",
    "skillConfigurationDialog": "systems/zweihander/templates/dialog/dialog-skill-configuration.html",
    "spellConfigurationDialog": "systems/zweihander/templates/dialog/dialog-spell-configuration.html",
    "weaponConfigurationDialog": "systems/zweihander/templates/dialog/dialog-weapon-configuration.html"
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