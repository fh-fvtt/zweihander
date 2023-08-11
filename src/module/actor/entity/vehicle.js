import ZweihanderBaseActor from './base-actor';

export default class ZweihanderVehicle extends ZweihanderBaseActor {
  prepareBaseData(actor) {
    // set up utility variables
    const systemData = actor.system;
    const vehicleOccupants = actor.getFlag('zweihander', 'vehicleOccupants');
    const drivers = vehicleOccupants?.drivers;

    const driversUpdated = drivers ? drivers.map((d) => fromUuidSync(d.uuid).toObject(false)) : [];

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

    const enc = systemData.stats.secondaryAttributes.encumbranceLimit;

    // assign current encumbrance
    enc.current = smallTrappingsEnc + normalTrappingsEnc; // + currencyEnc;
    // assign overage
    enc.overage = Math.max(0, enc.current - enc.value);

    let { driversBestPb, driversBestMovBonus } = this._prepareDriverDerivedData(systemData, driversUpdated);

    systemData.stats.secondaryAttributes.damageThreshold.value =
      systemData.stats.secondaryAttributes.sizeModifier.value + driversBestPb;

    // calculate movement
    const mov = systemData.stats.secondaryAttributes.movement;
    mov.value = mov.value ?? 0;
    mov.overage = enc.overage;
    mov.current = Math.max(0, mov.value - mov.overage) + driversBestMovBonus;
  }

  _prepareDriverDerivedData(systemData, drivers) {
    let driversBestPb = 0,
      driversBestMovBonus = 0;

    if (drivers) {
      for (let i = 0; i < drivers.length; i++) {
        const pb = drivers[i].system.stats.primaryAttributes.perception.bonus;

        if (pb > driversBestPb) {
          driversBestPb = pb;
        }
      }

      const pa = systemData.details.associatedPrimaryAttribute;

      for (let i = 0; i < drivers.length; i++) {
        const mb = drivers[i].system.stats.primaryAttributes[pa].bonus;

        console.log('MB', mb);

        if (mb > driversBestMovBonus) {
          driversBestMovBonus = mb;
        }
      }
    }

    return {
      driversBestPb: driversBestPb,
      driversBestMovBonus: driversBestMovBonus,
    };
  }

  async _preCreate(data, options, userId) {
    data.updateSource({
      flags: {
        ['zweihander']: {
          vehicleOccupants: {
            drivers: [],
            passengers: [],
          },
        },
      },
    });
  }
}
