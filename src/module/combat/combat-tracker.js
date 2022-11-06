export default class ZweihanderCombatTracker extends CombatTracker {
  get template() {
    return 'systems/zweihander/src/templates/combat/combat-tracker.hbs';
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}
