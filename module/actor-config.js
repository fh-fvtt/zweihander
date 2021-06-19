/**
 * 
 */
export class ZweihanderActorConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "zweihander_actor_config",
      template: "systems/zweihander/templates/actor/actor-config.html",
      width: 600
    });
  }

  /** @override */
  get title() {
    return `${this.object.name}: Actor Configuration`;
  }

  /** @override */
  getData() {
    const data = super.getData();

    data.flags = this.object.getFlag("zweihander", "actorConfig") || {};

    data.parrySkills = data.flags.parrySkills.join(", ");
    data.dodgeSkills = data.flags.dodgeSkills.join(", ");

    return data;
  }

  /** @override */
  async _updateObject(event, formData) {
    const actor = this.object;
    
    let updateData = foundry.utils.expandObject(formData).flags;

    let parrySkills = updateData.parrySkills.split(",").map(skill => skill.trim());
    let dodgeSkills = updateData.dodgeSkills.split(",").map(skill => skill.trim());;

    updateData.parrySkills = parrySkills;
    updateData.dodgeSkills = dodgeSkills;

    await actor.setFlag("zweihander", "actorConfig", updateData);
  }
}