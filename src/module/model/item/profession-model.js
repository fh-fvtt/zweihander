import ZweihanderBaseItemModel from './base-item-model';

import { normalizedEquals } from '../../system/utils';

const { ArrayField, BooleanField, HTMLField, NumberField, StringField, SchemaField } = foundry.data.fields;

export default class ZweihanderProfessionModel extends ZweihanderBaseItemModel {
  static linkedSingleProperties = [
    { property: 'professionalTrait', itemType: 'trait' },
    { property: 'specialTrait', itemType: 'trait' },
    { property: 'drawback', itemType: 'drawback' },
  ];

  static linkedListProperties = [
    {
      property: 'talents',
      itemType: 'talent',
      entryPostProcessor: (x) =>
        ZweihanderBaseItemModel.addPurchaseInfo(ZweihanderBaseItemModel.cleanLinkedItemEntry(x)),
    },
  ];

  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    const { drawback, professionalTrait, specialTrait } = Object.fromEntries(
      ['drawback', 'professionalTrait', 'specialTrait'].map((key) => [key, new SchemaField(this._linkedDocumentFields)])
    );

    const { bonusAdvances, skillRanks } = Object.fromEntries(
      ['bonusAdvances', 'skillRanks'].map((key) => [
        key,
        new ArrayField(
          new SchemaField({
            name: new StringField({ initial: '' }),
            purchased: new BooleanField({ initial: false }),
          })
        ),
      ])
    );

    return {
      ...schema,
      archetype: new StringField({ initial: 'Academic' }),
      bonusAdvances,
      drawback,
      expert: new SchemaField({
        requirements: new SchemaField({
          additional: new HTMLField({ initial: '' }),
          skillRanks: new ArrayField(
            new SchemaField({
              key: new StringField({ initial: '' }),
              value: new NumberField({ integer: true, initial: 1, min: 0 }),
            })
          ),
        }),
        value: new BooleanField({ initial: false }),
      }),
      professionalTrait,
      specialTrait,
      skillRanks,
      talents: new ArrayField(
        new SchemaField({
          ...this._linkedDocumentFields,
          purchased: new BooleanField({ initial: false }),
        })
      ),
      tier: new StringField({ initial: '' }),
    };
  }

  // ---=== GETTERS ===---

  get effectiveSkillRanks() {
    const item = this.parent;
    const actor = item.actor;

    if (!actor) return this.skillRanks;

    const uniqueAdvances = actor.itemTypes.uniqueAdvance.filter(
      (ua) =>
        ua.system.advanceType === 'skillRank' && ua.system.isReplacement && ua.system.associatedProfession === item.uuid
    );

    // shallow copy is enough since we don't mutate Skill Ranks themselves
    const effectiveSkillRanks = [...this.skillRanks];

    for (const ua of uniqueAdvances) {
      const originalSkillIndex = this.skillRanks.findIndex((sr) => sr.name === ua.system.associatedSkillRank.original);
      if (originalSkillIndex !== -1) {
        effectiveSkillRanks[originalSkillIndex] = {
          name: ua.system.associatedSkillRank.value,
          purchased: true,
          uniqueAdvance: true,
        };
      }
    }

    return effectiveSkillRanks;
  }

  get advancesPurchased() {
    const actor = this.parent.actor;

    if (!actor) return 0;

    const advancesPurchased =
      1 +
      this.bonusAdvances.reduce((a, b) => a + Number(b.purchased), 0) +
      this.effectiveSkillRanks.reduce((a, b) => a + Number(b.purchased), 0) +
      this.talents.reduce((a, b) => a + Number(b.purchased), 0);

    return advancesPurchased;
  }

  get completed() {
    const advancesRequired = game.settings.get('zweihander', 'advancesTotal');
    return this.advancesPurchased === advancesRequired;
  }

  // ---=== HELPER METHODS ===---

  async toggleProfessionPurchases(purchase) {
    const profession = this.parent;
    const updateData = {};

    const updatePurchase = (itemType) =>
      (updateData[`system.${itemType}`] = profession.system[itemType].map((t) => ({ ...t, purchased: purchase })));

    ['talents', 'skillRanks', 'bonusAdvances'].forEach(updatePurchase);

    await profession.update(updateData);
  }

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const item = this.parent;

    const primaryAttributeBonusesKeys = CONFIG.ZWEI.primaryAttributeBonuses.map((pab) => '[' + pab + ']');

    this.skillRanks.sort((a, b) => {
      const aloc = a.name;
      const bloc = b.name;
      return aloc.localeCompare(bloc);
    });

    this.bonusAdvances.sort(
      (a, b) => primaryAttributeBonusesKeys.indexOf(a.name) - primaryAttributeBonusesKeys.indexOf(b.name)
    );

    const localizedExpertProfessionValue = game.i18n.localize('ZWEI.actor.details.labels.expertprofession');

    if (this.expert.value && this.archetype.toLowerCase().replaceAll(/\s+/g, '') !== localizedExpertProfessionValue)
      this.archetype = localizedExpertProfessionValue;

    if (!item.isOwned) return;

    // ... only relevant if owned ...
  }

  /** @override */
  async _preCreateWithParent(item, actor) {
    await super._preCreateWithParent(item, actor);

    const professions = actor.itemTypes.profession;
    const tier = professions.length + 1;
    const addingOwnProfession = professions.some((p) => p._id === item._id);

    if (!addingOwnProfession && tier > 3) {
      ui.notifications.error(game.i18n.localize('ZWEI.othermessages.errorprofessions'));
      return false;
    }

    const allTiersCompleted = professions.every((p) => p.system.completed);

    if (!addingOwnProfession && !allTiersCompleted) {
      ui.notifications.error(game.i18n.localize('ZWEI.othermessages.errortier'));
      return false;
    }

    const isExpert = item.system.expert.value;
    const expertReqs = item.system.expert.requirements.skillRanks;

    if (isExpert && expertReqs.length) {
      const skills = actor.itemTypes.skill;

      for (let requirement of expertReqs) {
        const requiredSkill = skills.find((skill) => normalizedEquals(skill.name, requirement.key));

        if (requiredSkill.system.rank < requirement.value) {
          ui.notifications.error(
            game.i18n.format('ZWEI.othermessages.charnotmeetep', {
              profession: item.name,
              value: requirement.value,
              skill: requiredSkill.name,
            })
          );
          return false;
        }
      }
    }

    item.updateSource({
      'system.tier': game.i18n.localize('ZWEI.actor.tiers.' + CONFIG.ZWEI.tiers[tier]),
    });
  }

  /** @override */
  async _preUpdateWithParent(changed, actor) {
    await super._preUpdateWithParent(changed, actor);

    // @todo: refactor this mess to be clearer
    if (typeof changed.system['expert']?.['value'] !== 'undefined' && changed.system['expert']?.['value']) {
      changed.system['archetype'] = 'expert profession';
    } else if (
      typeof changed.system['expert']?.['value'] !== 'undefined' &&
      !changed.system['expert']?.['value'] &&
      typeof changed.system['archetype'] === 'undefined'
    ) {
      // reset to default value upon unchecking the 'Expert Profession' checkbox
      changed.system.archetype = game.i18n.localize('ZWEI.actor.details.labels.academic');

      // reset the requirement entries upon unchecking the 'Expert Profession' checkbox
      if (typeof changed.system.expert['requirements'] !== 'undefined')
        changed.system.expert.requirements.skillRanks = [];
    }

    if (changed.system['skillRanks'] !== undefined) {
      changed.system.skillRanks = changed.system.skillRanks.map((sr) => {
        // @todo: revert to old logic, see below
        const skillRanks = typeof sr === 'object' ? sr : { name: sr };
        return {
          ...skillRanks,
          purchased: sr.purchased ?? false,
        };
      });
    }

    if (changed.system['bonusAdvances'] !== undefined) {
      changed.system.bonusAdvances = changed.system.bonusAdvances.map((ba) => ({
        ...ba,
        purchased: ba.purchased ?? false,
      }));
    }
  }
}
