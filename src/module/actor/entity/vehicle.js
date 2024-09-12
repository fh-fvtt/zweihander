import ZweihanderBaseActor from './base-actor';

export default class ZweihanderVehicle extends ZweihanderBaseActor {
  prepareBaseData(actor) {
    // const configOptions = ZweihanderActorConfig.getConfig(actor);
    // set up utility variables
    const systemData = actor.system;

    // encumbrance calculations...
    // assign encumbrance from equipped trappings
    const carriedTrappings = actor.items.filter(
      (i) => ['trapping', 'armor', 'weapon'].includes(i.type) && i.system.carried
    );
    const nine4one = game.settings.get('zweihander', 'encumbranceNineForOne');
    const smallTrappingsEnc = !nine4one
      ? 0
      : Math.floor(
          carriedTrappings
            .filter((t) => t.system.encumbrance === 0)
            .map((t) => t.system.quantity || 0)
            .reduce((a, b) => a + b, 0) / 9
        );
    const normalTrappingsEnc = carriedTrappings
      .filter((t) => t.system.encumbrance !== 0)
      .map((t) => t.system.encumbrance * (t.system.quantity ?? 1))
      .reduce((a, b) => a + b, 0);

    const enc = systemData.stats.secondaryAttributes.encumbrance;

    // assign initial encumbrance threshold
    enc.value = enc.value ?? 0;
    // assign current encumbrance
    enc.current = smallTrappingsEnc + normalTrappingsEnc; // + currencyEnc;
    // assign overage
    enc.overage = Math.max(0, enc.current - enc.value);

    // calculate movement
    const mov = systemData.stats.secondaryAttributes.movement;
    mov.value = mov.value ?? 0;
    mov.overage = enc.overage;
    mov.current = Math.max(0, mov.value - mov.overage);
  }
}
