export default class ZweihanderActorConfig extends FormApplication {

  static defaultConfiguration = {
      "dthAttribute": "brawn",
      "pthAttribute": "willpower",
      "intAttribute": "perception",
      "movAttribute": "agility",
      "perilOffset": 0,
      "encumbranceModifier": 0,
      "initiativeModifier": 0,
      "movementModifier": 0,
      "parrySkills": ["Simple Melee", "Martial Melee", "Guile", "Charm", "Incantation"],
      "dodgeSkills": ["Coordination", "Guile", "Drive", "Ride"],
      "magickSkills": ["Incantation", "Folklore"],
      "isMagickUser": false,
      "permanentChaosRanks": 0
  };

  static getValue(actorData, key) {
    const value = getProperty(actorData.flags, `zweihander.actorConfig.${key}`);
    return value ?? this.defaultConfiguration[key];
  }

  static getConfig(actorData) {
    const cfg = {};
    for (let key in this.defaultConfiguration) {
      cfg[key] = this.getValue(actorData, key);
    }
    return cfg;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["zweihander sheet actor-config"],
      id: "zweihander_actor_config",
      template: "systems/zweihander/templates/actor/actor-config.hbs",
      width: 500,
      height: 950
    });
  }

  /** @override */
  get title() {
    return `${this.object.name}: Actor Configuration`;
  }

  /** @override */
  getData() {
    const data = super.getData();

    data.flags = ZweihanderActorConfig.getConfig(this.object.data);

    data.parrySkills = data.flags.parrySkills.join(", ");
    data.dodgeSkills = data.flags.dodgeSkills.join(", ");
    data.magickSkills = data.flags.magickSkills.join(", ");

    return data;
  }

  /** @override */
  async _updateObject(event, formData) {
    const actor = this.object;
    
    let updateData = foundry.utils.expandObject(formData).flags;

    let parrySkills = updateData.parrySkills.split(",").map(skill => skill.trim());
    let dodgeSkills = updateData.dodgeSkills.split(",").map(skill => skill.trim());
    let magickSkills = updateData.magickSkills.split(",").map(skill => skill.trim());

    updateData.parrySkills = parrySkills;
    updateData.dodgeSkills = dodgeSkills;
    updateData.magickSkills = magickSkills;

    await actor.setFlag("zweihander", "actorConfig", updateData);
  }
}