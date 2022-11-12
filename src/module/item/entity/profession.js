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
    if (tier > 3) return;
    item.updateSource({
      'system.tier': CONFIG.ZWEI.tiers[tier],
      'system.skillRanks': item.system.skillRanks.map((sr) => ({
        ...sr,
        purchased: false,
      })),
      'system.bonusAdvances': item.system.bonusAdvances.map((ba) => ({
        ...ba,
        purchased: false,
      })),
    });
    await super._preCreate(data, options, user, item);
  }

  async _preUpdate(changed, options, user, item) {
    if (changed.system['skillRanks'] !== undefined) {
      changed.system.skillRanks = changed.system.skillRanks.map((sr) => ({
        ...sr,
        purchased: sr.purchased ?? false,
      }));
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
