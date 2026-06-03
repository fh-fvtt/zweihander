const { CombatTracker } = foundry.applications.sidebar.tabs;

export default class ZweihanderCombatTracker extends CombatTracker {
  static DEFAULT_OPTIONS = {
    actions: {
      spendActionPoint: ZweihanderCombatTracker.#spendActionPoint,
      refundActionPoint: ZweihanderCombatTracker.#refundActionPoint,
    },
  };

  static PARTS = {
    ...super.PARTS,
    tracker: {
      template: 'systems/zweihander/src/templates/app/combat/tracker.hbs',
      scrollable: [''],
    },
  };

  // ---=== ACTION METHODS ===---

  static async #spendActionPoint(event, target) {
    ZweihanderCombatTracker._modifyActionPoints(this.viewed, target, -1);
  }

  static async #refundActionPoint(event, target) {
    ZweihanderCombatTracker._modifyActionPoints(this.viewed, target, 1);
  }

  // ---=== HELPER METHODS ===---

  static async _modifyActionPoints(viewed, target, mod) {
    const el = target.closest('[data-combatant-id]');
    const combatantId = el.dataset.combatantId;

    const combatant = viewed?.combatants.get(combatantId);
    if (!combatant) return;

    const actor = combatant.actor;
    const updatedValue = actor.system.stats.actionPoints.value + mod;

    // we only guard against lower bound because of temporary Action Points
    if (updatedValue < 0) {
      ui.notifications.error(
        `Actor "${actor.name}" does not have enough Action Points. Spend Fortune Points to gain more, or kindly petition the Prince of Change for a refill.`
      );
      return;
    }

    await actor.update({ 'system.stats.actionPoints.value': updatedValue });
  }
}
