export default class ZweihanderCombatTracker extends CombatTracker {
  get template() {
    return 'systems/zweihander/templates/combat/combat-tracker.hbs';
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}
