import ZweihanderBaseActorModel from './base-actor-model';
import ZweihanderActorConfig from '../../apps/actor-config';
import * as ZweihanderUtils from '../../system/utils';
import * as ZweihanderDice from '../../system/rolls/dice';

const { NumberField, StringField, SchemaField, TypedObjectField, ArrayField } = foundry.data.fields;
const { mergeObject } = foundry.utils;
const { DialogV2 } = foundry.applications.api;

export default class ZweihanderPlayerCharacterModel extends ZweihanderBaseActorModel {
  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    const getOrderChaosSchema = () =>
      new SchemaField({
        rank: new NumberField({ integer: true, initial: 0, min: 0 }),
        name: new StringField({ initial: '' }),
        description: new StringField({ initial: '' }),
      });

    return {
      ...schema,
      currency: new TypedObjectField(this._currencyFields, {
        validateKey: (key) => typeof key === 'string' && key.trim().length > 0,
      }),
      languages: new ArrayField(this._languagesFields),
      details: new SchemaField(this._detailsFields),
      alignment: new SchemaField({
        corruption: new NumberField({ integer: true, initial: 0, min: 0 }),
        order: getOrderChaosSchema(),
        chaos: getOrderChaosSchema(),
      }),
    };
  }

  // ---=== SCHEMA GETTERS ===---

  /** @override */
  static get _statsFields() {
    return {
      ...super._statsFields,
      fate: new NumberField({ integer: true, initial: 0, min: 0 }),
      reputation: new NumberField({ integer: true, initial: 0, min: 0 }),
      rewardPoints: new SchemaField({
        current: new NumberField({ integer: true, initial: 1000, min: 0 }),
        total: new NumberField({ integer: true, initial: 1000, min: 0 }),
        spent: new NumberField({ integer: true, initial: 0, min: 0 }),
      }),
    };
  }

  /** @override */
  static get _secondaryAttributeFields() {
    const { encumbrance, initiative, movement } = Object.fromEntries(
      ['encumbrance', 'initiative', 'movement'].map((key) => [
        key,
        new SchemaField({
          value: new NumberField({ integer: true, initial: 0, persisted: false, min: 0 }),
        }),
      ])
    );

    return {
      ...super._secondaryAttributeFields,
      encumbrance,
      initiative,
      movement,
    };
  }

  /** @override */
  static get _detailsFields() {
    return {
      ...super._detailsFields,
      pronoun: new StringField({ initial: '' }),
      socialClass: new StringField({ initial: '' }),
      seasonOfBirth: new StringField({ initial: '' }),
      dooming: new StringField({ initial: '' }),
      distinguishingMarks: new StringField({ initial: '' }),
      upbringing: new StringField({ initial: '' }),
      age: new StringField({ initial: '' }),
      sex: new StringField({ initial: '' }),
      height: new StringField({ initial: '' }),
      weight: new StringField({ initial: '' }),
      hairColor: new StringField({ initial: '' }),
      eyeColor: new StringField({ initial: '' }),
      complexion: new StringField({ initial: '' }),
      buildType: new StringField({ initial: '' }),
    };
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const actor = this.parent;
    const configOptions = actor.system.settings;
    const noWarn = CONFIG.ZWEI.NO_WARN || actor._id === null;
    const systemData = actor.system;

    const alternativePerilSystem = game.settings.get('zweihander', 'alternativePerilSystem');

    const basePerilCurrent = systemData.stats.secondaryAttributes.perilCurrent.value;
    const effectivePerilCurrent = actor.getEffectivePerilLadderValue(
      basePerilCurrent,
      configOptions.isIgnoredPerilLadderValue
    );

    systemData.stats.secondaryAttributes.perilCurrent.effectiveValue = effectivePerilCurrent;

    const perilMalus = actor.getPerilMalus(effectivePerilCurrent, alternativePerilSystem);

    // calculate special actions underlying values
    const calcSecondayAttributeSpecialActionValue = (secAttr, name) => {
      const skill = actor.items.find((item) => item.type === 'skill' && item.name === secAttr.associatedSkill);
      if (skill) {
        const primAttr = skill.system.associatedPrimaryAttribute.toLowerCase();
        const perilMalusFinal = alternativePerilSystem
          ? skill.system.bonus + perilMalus
          : Math.max(0, skill.system.bonus - perilMalus);
        secAttr.value = Math.max(0, systemData.stats.primaryAttributes[primAttr].value + perilMalusFinal);
      } else {
        noWarn ||
          ui?.notifications?.warn(
            game.i18n.format('ZWEI.othermessages.noassociated', {
              associated: secAttr.associatedSkill,
              secondary: name,
            })
          );
      }
    };

    const rollables = ['parry', 'dodge', 'magick', 'madness'];

    for (let r of rollables)
      calcSecondayAttributeSpecialActionValue(systemData.stats.secondaryAttributes[r], r.capitalize());

    // calculate maximum action points
    systemData.stats.actionPoints.max = 3 + systemData.stats.actionPoints.extra + configOptions.apModifier;

    const professions = actor.itemTypes.profession;
    const uniqueAdvances = actor.itemTypes.uniqueAdvance;

    // calculate reward points automatically
    const trackRewardPoints = game.settings.get('zweihander', 'trackRewardPoints');

    if (trackRewardPoints) {
      const tierMultiplier = ZweihanderUtils.getLocalizedRewardPointMapping();

      systemData.stats.rewardPoints.spent = professions
        .map((profession) => {
          const replacementUniqueAdvances = uniqueAdvances.filter(
            (ua) =>
              ua.system.advanceType === 'skillRank' &&
              ua.system.isReplacement &&
              ua.system.associatedProfession === profession.uuid &&
              ua.system.associatedSkillRank.original &&
              ua.system.associatedSkillRank.value
          );

          return (
            tierMultiplier[profession.system.tier] *
            (profession.system.advancesPurchased - replacementUniqueAdvances.length)
          );
        })
        .concat(uniqueAdvances.map((ua) => ua.system.rewardPointCost))
        .reduce((a, b) => a + b, 0);
      systemData.stats.rewardPoints.current = systemData.stats.rewardPoints.total - systemData.stats.rewardPoints.spent;
    }

    const tierKey = CONFIG.ZWEI.tiers[actor.items.filter((i) => i.type === 'profession').length];

    if (typeof tierKey === 'undefined') systemData.tier = '';
    else systemData.tier = game.i18n.localize('ZWEI.actor.tiers.' + tierKey);

    // calculate primary attribute bonuses (first digit)
    Object.values(systemData.stats.primaryAttributes).forEach((a) => (a.bonus = Math.floor(a.value / 10)));

    // add ancestral modifiers to the primary attribute bonuses
    const ancestry = actor.items.find((i) => i.type === 'ancestry');
    const applyBonusModifiers = (list, mod, source) =>
      list?.forEach?.((a) => {
        const attr = ZweihanderUtils.primaryAttributeMapping[a.slice(1, 2)];
        //TODO should be safe to remove this after migration of existing data
        if (!attr) {
          ui?.notifications?.warn(
            game.i18n.format('ZWEI.othermessages.novalidprimary', { primary: a.trim(), source: source })
          );
          return;
        }
        systemData.stats.primaryAttributes[attr].bonus += mod;
      });

    // ancestral bonus advances
    if (ancestry) {
      applyBonusModifiers(
        ancestry.system.ancestralModifiers.positive,
        +1,
        `ancestry ${ancestry.name} of actor ${actor.name}`
      );
      applyBonusModifiers(
        ancestry.system.ancestralModifiers.negative,
        -1,
        `ancestry ${ancestry.name} of actor ${actor.name}`
      );
    }

    // professional bonus advances
    actor.items
      .filter((i) => i.type === 'profession')
      .forEach((p) => {
        const advancesList = p.system.bonusAdvances?.filter?.((a) => a.purchased)?.map?.((a) => a.name) ?? [];
        applyBonusModifiers(advancesList, +1, `profession ${p.name} of actor ${actor.name}`);
      });

    // calculate primary attribute base bonus values (prior to Active Effects being applied)
    Object.values(systemData.stats.primaryAttributes).forEach((a) => (a.baseBonus = a.bonus));

    actor.applyActiveEffects('intermediate');

    // assign inital peril & damage
    const sa = systemData.stats.secondaryAttributes;
    sa.perilThreshold = {};
    sa.damageThreshold = {};

    sa.perilThreshold.baseValue = systemData.stats.primaryAttributes[configOptions.pthAttribute].bonus + 3; // for Active Effect purposes
    sa.perilThreshold.value = sa.perilThreshold.baseValue;

    // get equipped armor
    const equippedArmor = actor.itemTypes.armor.filter((a) => a.system.equipped);

    // calculate total damage threshold modifier from armor
    // according to the rule book, this doesn't stack, so we choose the maximium
    const maxEquippedArmor =
      equippedArmor?.[ZweihanderUtils.argMax(equippedArmor.map((a) => a.system.damageThresholdModifier))];
    const damageModifier = maxEquippedArmor?.system?.damageThresholdModifier ?? 0;
    sa.damageThreshold.value = systemData.stats.primaryAttributes[configOptions.dthAttribute].bonus + damageModifier;

    // active effects tracking
    sa.damageThreshold.baseValue = systemData.stats.primaryAttributes[configOptions.dthAttribute].bonus;
    sa.damageThreshold.dtm = damageModifier;

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

    // assign encumbrance from currency
    const currencyEnc = game.settings.get('zweihander', 'currencyEncumbrance')
      ? Math.floor(Object.values(systemData.currency).reduce((a, b) => a + b, 0) / 1000)
      : 0;

    const enc = (systemData.stats.secondaryAttributes.encumbrance = {});

    // assign initial encumbrance threshold
    enc.baseValue = systemData.stats.primaryAttributes.brawn.bonus + 3 + configOptions.encumbranceModifier;
    enc.value = enc.baseValue;

    // assign current encumbrance
    enc.current = smallTrappingsEnc + normalTrappingsEnc + currencyEnc;

    // calculate initiative
    const ini = (systemData.stats.secondaryAttributes.initiative = {});
    ini.baseValue =
      systemData.stats.primaryAttributes[configOptions.intAttribute].bonus + 3 + configOptions.initiativeModifier;
    ini.value = ini.baseValue;

    // calculate movement
    const mov = (systemData.stats.secondaryAttributes.movement = {});
    mov.baseValue =
      systemData.stats.primaryAttributes[configOptions.movAttribute].bonus + 3 + configOptions.movementModifier;
    mov.value = mov.baseValue;

    // apply Active Effects to derived values here
    actor.applyActiveEffects('advanced');

    // these have to come after Active Effects, since they depend on derived values that can be affected by Active Effects
    enc.overage = Math.max(0, enc.current - enc.value);

    ini.overage = enc.overage;
    ini.current = Math.max(0, ini.value - ini.overage);

    systemData.stats.secondaryAttributes.initiative.baseFormula = `${
      configOptions.initiativeOverride ? configOptions.initiativeOverride : 1
    }d10`;

    mov.overage = enc.overage;
    mov.current = Math.max(0, mov.value - mov.overage);
  }

  /** @override */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const actor = this.parent;
    const pas = actor.system.stats.primaryAttributes;

    const updateData = {};

    // roll primary attributes for new Player Character
    if (CONFIG.ZWEI.primaryAttributes.every((pa) => pas[pa].value === 40)) {
      for (let pa of CONFIG.ZWEI.primaryAttributes) {
        const roll = await new Roll('3d10+25').evaluate();
        updateData[`system.stats.primaryAttributes.${pa}.value`] = roll.total;
      }
    }

    const configOptions = actor.system.settings;
    const selectableTests = {
      parry: 'parry',
      dodge: 'dodge',
      magick: 'magick',
      peril: 'madness',
    };

    for (const [configKey, key] of Object.entries(selectableTests))
      updateData[`system.stats.secondaryAttributes.${key}.associatedSkill`] = configOptions[`${configKey}Skills`][0];

    if (!updateData.prototypeToken) {
      mergeObject(updateData, {
        'prototypeToken.actorLink': true,
        'prototypeToken.lockRotation': true,
        'prototypeToken.name': data.name,
      });
    }

    await actor.updateSource(updateData);
  }

  /** @override */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    const actor = this.parent;

    const oldDamage = actor.system.stats.secondaryAttributes.damageCurrent.value;
    const newDamage = changes.system?.stats?.secondaryAttributes?.damageCurrent?.value;

    const injurySettingEnabled = game.settings.get('zweihander', 'injuryPrompt');

    if (injurySettingEnabled && newDamage !== undefined && newDamage < oldDamage && newDamage > 0 && newDamage <= 3) {
      let injuryToRoll = newDamage == 3 ? 'moderate' : newDamage == 2 ? 'serious' : 'grievous';

      await DialogV2.confirm({
        window: {
          title: `${actor.name}: ` + game.i18n.localize('ZWEI.othermessages.injuryconfig'),
          icon: 'fas fa-user-injured',
        },
        content: game.i18n.format('ZWEI.othermessages.rollinjury', {
          injury: game.i18n.localize('ZWEI.actor.conditions.' + injuryToRoll.toLowerCase() + 'ly'),
        }),
        yes: { callback: () => ZweihanderDice.rollInjury(injuryToRoll, actor) },
        position: { width: 455 },
        defaultYes: false,
        rejectClose: false,
      });
    }
  }
}
