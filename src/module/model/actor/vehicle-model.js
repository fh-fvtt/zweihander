import ZweihanderBaseActorModel from './base-actor-model';
const { NumberField, StringField, BooleanField, SchemaField, ArrayField, TypedObjectField } = foundry.data.fields;

export default class ZweihanderVehicleModel extends ZweihanderBaseActorModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
      details: new SchemaField(this._detailsFields),
    };
  }

  // ---=== SCHEMA GETTERS ===---

  /** @override */
  static get _statsFields() {
    return {
      ...super._statsFields,
      manualMode: new BooleanField({ initial: false }),
    };
  }

  /** @override */
  static get _primaryAttributeFields() {
    // no call to super since we don't want any primary attribute fields
    return {};
  }

  /** @override */
  static get _secondaryAttributeFields() {
    const { damageCurrent, damageThreshold } = super._secondaryAttributeFields;

    return {
      damageCurrent,
      damageThreshold,
      sizeModifier: new SchemaField({
        value: new NumberField({ integer: true, initial: 0, min: 0 }),
      }),
      encumbranceLimit: new SchemaField({
        value: new NumberField({ integer: true, initial: 0, min: 0 }),
      }),
      movement: new SchemaField({
        value: new NumberField({ integer: true, initial: 0, min: 0 }),
      }),
    };
  }

  /** @override */
  static get _detailsFields() {
    return {
      ...super._detailsFields,
      associatedPrimaryAttribute: new StringField({ initial: 'brawn' }),
      operateSkill: new StringField({ initial: '' }),
      horsepower: new StringField({ initial: '' }),
    };
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    const actor = this.parent;

    const systemData = actor.system;
    const vehicleOccupants = actor.getFlag('zweihander', 'vehicleOccupants');
    const drivers = vehicleOccupants?.drivers;

    const pa = systemData.details.associatedPrimaryAttribute;
    systemData.details.associatedPrimaryAttribute = pa || 'brawn';

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

    let { driversBestPb, driversBestMovBonus } = this._prepareDriverDerivedData(systemData, drivers);

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

      // console.log(pa, drivers);

      for (let i = 0; i < drivers.length; i++) {
        const mb = drivers[i].system.stats.primaryAttributes[pa].bonus;

        // console.log('MB', mb);

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

  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const actor = this.parent;

    // @todo: refactor flags into data model
    actor.updateSource({
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
