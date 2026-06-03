const { Combat } = foundry.documents;

export default class ZweihanderCombat extends Combat {
  // ---=== HELPER METHODS ===---

  async _consumeSurprise(actors) {
    if (!actors || actors.length === 0) return;

    await Promise.all(
      actors.map(async (actor) => {
        for (const effect of actor.allApplicableEffects()) {
          if (effect.active && effect.statuses.has('surprised')) {
            await effect.delete();
            break;
          }
        }
      })
    );
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  async startCombat() {
    this._playCombatSound('startEncounter');
    const firstTurn = this.turns.findIndex((t) => !t.actor?.statuses.has('surprised'));
    const updateData = { round: 1, turn: firstTurn === -1 ? 0 : firstTurn };
    const surprisedCombatants = [];

    this.turns.forEach((t, i) => {
      if (i < firstTurn && t.actor?.statuses.has('surprised')) {
        surprisedCombatants.push(t.actor);
      }
    });

    await this._consumeSurprise(surprisedCombatants);

    Hooks.callAll('combatStart', this, updateData);
    await this.update(updateData);
    await ActiveEffect.registry.refresh('combatStart', { combat: this });
    return this;
  }

  /** @override */
  async nextRound() {
    let turn = this.turn === null || this.turns.length === 0 ? null : 0; // Preserve the fact that it's no-one's turn currently.

    const surprisedCombatants = [];

    if (turn !== null) {
      if (this.settings.skipDefeated && !this.turns.some((t) => !t.isDefeated)) {
        ui.notifications.warn('COMBAT.NoneRemaining', { localize: true });
      }

      const firstTurn = this.turns.findIndex((t) => {
        const isDefeated = t.isDefeated && this.settings.skipDefeated;
        const isSurprised = t.actor?.statuses.has('surprised');
        return !isDefeated && !isSurprised;
      });

      this.turns.forEach((t, i) => {
        const isSkipped = firstTurn === -1 ? i > 0 : i < firstTurn;
        if (isSkipped && t.actor?.statuses.has('surprised')) {
          surprisedCombatants.push(t.actor);
        }
      });

      // fallback to 0 if everyone is to be skipped
      turn = firstTurn === -1 ? 0 : firstTurn;
    }

    await this._consumeSurprise(surprisedCombatants);

    const nextRound = this.round + 1;
    const advanceTime = this.getTimeDelta(this.round, this.turn, nextRound, turn);

    // Update the document, passing data through a hook first
    const updateData = { round: nextRound, turn };
    const updateOptions = { direction: 1, worldTime: { delta: advanceTime } };
    Hooks.callAll('combatRound', this, updateData, updateOptions);
    await this.update(updateData, updateOptions);
    return this;
  }

  /** @override */
  async nextTurn() {
    if (this.round === 0) return this.nextRound();

    const turn = this.turn ?? -1;
    const surprisedCombatants = [];

    // Determine the next turn number
    let nextTurn = null;
    for (let i = turn + 1; i < this.turns.length; i++) {
      const t = this.turns[i];
      const isDefeated = t.isDefeated && this.settings.skipDefeated;
      const isSurprised = t.actor?.statuses?.has('surprised');

      if (isSurprised) {
        surprisedCombatants.push(t.actor);
      }

      if (!isDefeated && !isSurprised) {
        nextTurn = i;
        break;
      }
    }

    await this._consumeSurprise(surprisedCombatants);

    // Maybe advance to the next round
    if (nextTurn === null || nextTurn >= this.turns.length) return this.nextRound();

    const advanceTime = this.getTimeDelta(this.round, this.turn, this.round, nextTurn);

    // Update the document, passing data through a hook first
    const updateData = { round: this.round, turn: nextTurn };
    const updateOptions = { direction: 1, worldTime: { delta: advanceTime } };
    Hooks.callAll('combatTurn', this, updateData, updateOptions);
    await this.update(updateData, updateOptions);
    return this;
  }

  /** @override */
  async _onStartTurn(combatant, context) {
    await super._onStartTurn(combatant, context);

    const actor = combatant.actor;
    if (context.skipped || !actor) return; // @todo: check if this guard is needed in the future

    const { value, max } = actor.system.stats.actionPoints;
    const isStunned = actor.statuses.has('stunned');
    const updatedActionPoints = isStunned ? (max > 0 ? max - 1 : 0) : max;

    if (value !== max || isStunned) {
      await actor.update({ 'system.stats.actionPoints.value': updatedActionPoints });
    }
  }

  /** @override */
  async _onEnter(combatant) {
    const actor = combatant.actor;
    if (!actor) return;

    const { value, max } = actor.system.stats.actionPoints;

    if (value < max) {
      await actor.update({ 'system.stats.actionPoints.value': max });
    }
  }
}
