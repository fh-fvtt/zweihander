export default class ZweihanderActorConfig extends FormApplication {

  static defaultConfiguration = {
      "dthAttribute": "brawn",
      "pthAttribute": "willpower",
      "intAttribute": "perception",
      "movAttribute": "agility",
      "isIgnoredPerilLadderValue": [false, false, false],
      //   "avoidStepOne": false,
      //   "avoidStepTwo": false,
      //   "avoidStepThree": false,
      //   "avoidAll": false
      // },
      "encumbranceModifier": 0,
      "initiativeModifier": 0,
      "movementModifier": 0,
      "parrySkills": ["Simple Melee", "Martial Melee", "Guile", "Charm", "Incantation"],
      "dodgeSkills": ["Coordination", "Guile", "Drive", "Ride"],
      "magickSkills": ["Incantation", "Folklore"],
      "isMagickUser": false,
      "permanentChaosRanks": 0,
      "permanentOrderRanks": 0
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
      template: "systems/zweihander/templates/app/actor-config.hbs",
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false,
      width: 500,
      height: 950,
      scrollY: ['form']
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
    data.avoidAllPeril = data.flags.isIgnoredPerilLadderValue.reduce((a,b) => a && b, true);

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
    // wtf is this template system haha
    updateData.isIgnoredPerilLadderValue = [
      updateData.isIgnoredPerilLadderValue['[0]'],
      updateData.isIgnoredPerilLadderValue['[1]'],
      updateData.isIgnoredPerilLadderValue['[2]']
    ];
    const avoidAllUpdate = foundry.utils.expandObject(formData).avoidAllPeril;
    const avoidAllBefore = ZweihanderActorConfig.getConfig(this.object.data).isIgnoredPerilLadderValue.reduce((a,b) => a && b, true);
    if (avoidAllUpdate && !avoidAllBefore) {
      updateData.isIgnoredPerilLadderValue = [true, true, true];
    } else if (!avoidAllUpdate && avoidAllBefore) {
      updateData.isIgnoredPerilLadderValue = [false, false, false];
    }

    await actor.setFlag("zweihander", "actorConfig", updateData);
    console.log(event);
    this.render();
  }
}