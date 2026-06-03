const { Combatant } = foundry.documents;

export default class ZweihanderCombatant extends Combatant {
  updateResource() {
    if (!this.actor || !this.combat) return (this.resource = null);
    const value = foundry.utils.getProperty(this.actor.system, this.parent.settings.resource);
    return (this.resource = value === 0 ? value : value || null);
  }
}
