import { normalizedEquals } from '../../utils';
import ZweihanderBaseItem from './base-item';

export default class ZweihanderProfession extends ZweihanderBaseItem {
  static async toggleProfessionPurchases(profession, purchase) {
    const updateData = {};
    const updatePurchase = (itemType) =>
      (updateData[`system.${itemType}`] = profession.system[itemType].map((t) => ({ ...t, purchased: purchase })));
    ['talents', 'skillRanks', 'bonusAdvances'].forEach(updatePurchase);
    await profession.update(updateData);
  }

  static linkedSingleProperties = [
    { property: 'professionalTrait', itemType: 'trait' },
    { property: 'specialTrait', itemType: 'trait' },
    { property: 'drawback', itemType: 'drawback' },
  ];

  static linkedListProperties = [
    {
      property: 'talents',
      itemType: 'talent',
      entryPostProcessor: (x) => ZweihanderBaseItem.addPurchaseInfo(ZweihanderBaseItem.cleanLinkedItemEntry(x)),
    },
  ];

  prepareDerivedData(item) {
    if (item.system.expert.value && item.system.archetype !== 'expert profession')
      item.system.archetype = 'expert profession';

    if (!item.isOwned) return;

    const advancesPurchased =
      1 +
      (item.system.bonusAdvances?.reduce?.((a, b) => a + Number(b.purchased), 0) ?? 0) +
      (item.system.skillRanks?.reduce?.((a, b) => a + Number(b.purchased), 0) ?? 0) +
      (item.system.talents?.reduce?.((a, b) => a + Number(b.purchased), 0) ?? 0);
    item.system.advancesPurchased = advancesPurchased;
    item.system.completed = advancesPurchased === 21;
  }

  async _preCreate(data, options, user, item) {
    const tier = item.parent.items.filter((i) => i.type === 'profession').length + 1;

    const isExpert = item.system.expert.value;
    const expertReqs = item.system.expert.requirements.skillRanks;

    if (isExpert && expertReqs.length) {
      const skills = item.parent.items.filter((i) => i.type === 'skill');

      for (let requirement of expertReqs) {
        const requiredSkill = skills.find((skill) => normalizedEquals(skill.name, requirement.key));

        if (requiredSkill.system.rank < requirement.value) {
          ui.notifications.error(
            game.i18n.format("ZWEI.othermessages.charnotmeetep", { profession: item.name, value: requirement.value, skill: requiredSkill.name})
          );
          return false;
        }
      }
    }

    if (tier > 3) return;

    item.updateSource({
      'system.tier': CONFIG.ZWEI.tiers[tier],
    });

    await super._preCreate(data, options, user, item);
  }

  async _preUpdate(changed, options, user, item) {
    if (typeof changed.system['expert']?.['value'] !== 'undefined' && changed.system['expert']?.['value']) {
      changed.system['archetype'] = 'expert profession';
    } else if (
      typeof changed.system['expert']?.['value'] !== 'undefined' &&
      !changed.system['expert']?.['value'] &&
      typeof changed.system['archetype'] === 'undefined'
    ) {
      // reset to default value upon unchecking the 'Expert Profession' checkbox
      changed.system.archetype = 'Academic';

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
    await super._preUpdate(changed, options, user, item);
  }
}
