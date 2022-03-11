import ZweihanderBaseItem from "./base-item";

export default class ZweihanderProfession extends ZweihanderBaseItem {

  static async toggleProfessionPurchases(profession, purchase) {
    const updateData = {};
    const updatePurchase = (itemType) =>
      updateData[`data.${itemType}`] = profession.data.data[itemType]
        .map(t => ({ ...t, purchased: purchase }));
    ["talents", "skillRanks", "bonusAdvances"].forEach(updatePurchase);
    await profession.update(updateData);
  }

  static linkedSingleProperties = [
    { property: 'professionalTrait', itemType: 'trait' },
    { property: 'specialTrait', itemType: 'trait' },
    { property: 'drawback', itemType: 'drawback' }
  ];

  static linkedListProperties = [
    {
      property: 'talents',
      itemType: 'talent',
      entryPostProcessor: x =>
        ZweihanderBaseItem.addPurchaseInfo(ZweihanderBaseItem.cleanLinkedItemEntry(x))
    }
  ]

  prepareDerivedData(itemData, item) {
    if (!item.isOwned) return;
    const advancesPurchased = 1
      + (itemData.data.bonusAdvances?.reduce?.((a, b) => a + Number(b.purchased), 0) ?? 0)
      + (itemData.data.skillRanks?.reduce?.((a, b) => a + Number(b.purchased), 0) ?? 0)
      + (itemData.data.talents?.reduce?.((a, b) => a + Number(b.purchased), 0) ?? 0);
    itemData.data.tier.advancesPurchased = advancesPurchased;
    itemData.data.tier.completed = advancesPurchased === 21;
  }

  async _preCreate(data, options, user, item) {
    const itemData = item.data;
    const tier = item.parent.items.filter(i => i.type === 'profession').length + 1;
    if (tier > 3) return;
    itemData.update({ 'data.tier.value': CONFIG.ZWEI.tiers[tier] });
    itemData.update({ 'data.skillRanks': itemData.data.skillRanks.map(sr => ({ ...sr, purchased: false })) });
    itemData.update({ 'data.bonusAdvances': itemData.data.bonusAdvances.map(ba => ({ ...ba, purchased: false })) });
    await super._preCreate(data, options, user, item);
  }

  async _preUpdate(changed, options, user, item) {
    if (changed.data['skillRanks'] !== undefined) {
      changed.data.skillRanks = changed.data.skillRanks.map(sr => ({ ...sr, purchased: sr.purchased ?? false }));
    }
    if (changed.data['bonusAdvances'] !== undefined) {
      changed.data.bonusAdvances = changed.data.bonusAdvances.map(ba => ({ ...ba, purchased: ba.purchased ?? false }));
    }
    await super._preUpdate(changed, options, user, item);
  }

}