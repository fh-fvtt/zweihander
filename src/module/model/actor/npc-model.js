import ZweihanderCreatureModel from './creature-model';
import * as ZweihanderUtils from '../../system/utils';

const { StringField } = foundry.data.fields;

export default class ZweihanderNpcModel extends ZweihanderCreatureModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    return {
      ...schema,
    };
  }

  // ---=== SCHEMA GETTERS ===---

  /** @override */
  static get _detailsFields() {
    return {
      ...super._detailsFields,
      ancestry: new StringField({ initial: '' }),
      archetype: new StringField({ initial: '' }),
      age: new StringField({ initial: '' }),
      sex: new StringField({ initial: '' }),
      height: new StringField({ initial: '' }),
      build: new StringField({ initial: '' }),
      distinguishingMarks: new StringField({ initial: '' }),
      complexion: new StringField({ initial: '' }),
      socialClass: new StringField({ initial: '' }),
      persona: new StringField({ initial: '' }),
      motivation: new StringField({ initial: '' }),
      alignment: new StringField({ initial: '' }),
      mannerOfDress: new StringField({ initial: '' }),
    };
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const actor = this.parent;

    const systemData = actor.system;
    const sa = systemData.stats.secondaryAttributes;

    // calculate primary attribute base bonus values (prior to Active Effects being applied)
    Object.values(systemData.stats.primaryAttributes).forEach((a) => (a.baseBonus = a.bonus));

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

    const enc = (systemData.stats.secondaryAttributes.encumbrance = {});

    enc.baseValue = systemData.stats.primaryAttributes.brawn.bonus + 3;
    enc.value = enc.baseValue;

    enc.current = smallTrappingsEnc + normalTrappingsEnc; // + currencyEnc;
    enc.overage = Math.max(0, enc.current - enc.value);

    if (!actor.system.stats.manualMode) {
      const equippedArmor = actor.items.filter((a) => a.type === 'armor');

      const maxEquippedArmor =
        equippedArmor?.[ZweihanderUtils.argMax(equippedArmor.map((a) => a.system.damageThresholdModifier))];

      const damageModifier = maxEquippedArmor?.system?.damageThresholdModifier ?? 0;

      sa.damageThreshold.value = systemData.stats.primaryAttributes.brawn.bonus + damageModifier;
      sa.damageThreshold.baseValue = systemData.stats.primaryAttributes.brawn.bonus;
      sa.damageThreshold.dtm = damageModifier;

      // calculate movement
      const mov = systemData.stats.secondaryAttributes.movement;
      mov.value = mov.value ?? 0;
      mov.overage = enc.overage;
      mov.current = Math.max(0, mov.value - mov.overage);
    }
  }
}
