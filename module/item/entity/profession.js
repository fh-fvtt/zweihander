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
    const talentsToFetch = itemData.data.talents.map(v => v.value);
    if (talentsToFetch.length) {
      const talents = await ZweihanderBaseItem.getOrCreateLinkedItems(item.parent, talentsToFetch, 'talent', item.name, 'profession');
      itemData.update({ 'data.talents': talents.map(t => ({ ...t, purchased: false })) });
    }
    const professionalTraitToFetch = itemData.data.professionalTrait.value.trim();
    const specialTraitToFetch = itemData.data.specialTrait.value.trim();
    const traits = await ZweihanderBaseItem.getOrCreateLinkedItems(item.parent, [professionalTraitToFetch, specialTraitToFetch], 'trait', item.name, 'profession');
    itemData.update({ 'data.professionalTrait': traits[0], 'data.specialTrait': traits[1] });
    const drawbackToFetch = itemData.data.drawback.value;
    const drawback = await ZweihanderBaseItem.getOrCreateLinkedItem(item.parent, drawbackToFetch, 'drawback', item.name, 'profession');
    itemData.update({ 'data.drawback': drawback });
  }

  async _preUpdate(changed, options, user, item) {
    const actor = item.parent;
    const itemData = item.data;
    const diffData = changed.data;
    const diffPaths = flattenObject(changed.data);
    const idsToDelete = [];
    if (diffPaths['skillRanks'] !== undefined) {
      diffData.skillRanks = diffData.skillRanks.map(sr => ({ ...sr, purchased: sr.purchased ?? false }));
    }
    if (diffPaths['bonusAdvances'] !== undefined) {
      diffData.bonusAdvances = diffData.bonusAdvances.map(ba => ({ ...ba, purchased: ba.purchased ?? false }));
    }
    if (diffPaths['talents'] !== undefined) {
      const talentsDiff = ZweihanderBaseItem.getLinkedItemsDifference(diffData.talents, itemData.data.talents);
      idsToDelete.push(...talentsDiff.idsToDelete);
      const addedTalents = await ZweihanderBaseItem.getOrCreateLinkedItems(item.parent, talentsDiff.namesToAdd, 'talent', item.name, 'profession');
      const lookUp = addedTalents.reduce((a, b) => ({ ...a, [b.value]: { ...b, purchased: false } }), {});
      // update names 
      diffData.talents = diffData.talents.map(t => lookUp[t.value] ? lookUp[t.value] : t);
    }
    if (diffPaths['professionalTrait.value'] !== undefined) {
      const newTrait = diffData.professionalTrait.value.trim();
      const oldTrait = itemData.data.professionalTrait.value;
      if (newTrait !== oldTrait) {
        idsToDelete.push(itemData.data.professionalTrait.linkedId);
        const trait = await ZweihanderBaseItem.getOrCreateLinkedItem(actor, newTrait, 'trait', itemData.name, 'profession');
        if (trait) {
          diffData.professionalTrait = trait;
        }
      }
    }
    if (diffPaths['specialTrait.value'] !== undefined) {
      const newTrait = diffData.specialTrait.value.trim();
      const oldTrait = itemData.data.specialTrait.value;
      if (newTrait !== oldTrait) {
        idsToDelete.push(itemData.data.specialTrait.linkedId);
        const trait = await ZweihanderBaseItem.getOrCreateLinkedItem(actor, newTrait, 'trait', itemData.name, 'profession');
        if (trait) {
          diffData.specialTrait = trait;
        }
      }
    }
    if (diffPaths['drawback.value'] !== undefined) {
      const newDrawback = diffData.drawback.value.trim();
      const oldDrawback = itemData.data.drawback.value;
      if (newDrawback !== oldDrawback) {
        idsToDelete.push(itemData.data.drawback.linkedId);
        const drawback = await ZweihanderBaseItem.getOrCreateLinkedItem(actor, newDrawback, 'drawback', itemData.name, 'profession');
        if (drawback) {
          diffData.drawback = drawback;
        }
      }
    }
    options.idsToDelete = idsToDelete;
  }

  async _onUpdate(changed, options, user, item) {
    if (options.idsToDelete.length) {
      await ZweihanderBaseItem.removeLinkedItems(item.parent, options.idsToDelete);
    }
  }

  async _preDelete(options, user, item) {
    options.idsToDelete = [
      item.data.data.specialTrait,
      item.data.data.professionalTrait,
      item.data.data.drawback,
      ...item.data.data.talents
    ].map(v => v.linkedId);
  }

  async _onDelete(options, user, item) {
    await ZweihanderBaseItem.removeLinkedItems(item.parent, options.idsToDelete);
  }

}