import * as ZweihanderUtils from "../../utils";

export default class ZweihanderBaseItem {

  static async _getOrCreateLinkedItem(actor, itemName, itemType, sourceName, sourceType) {
    let itemToAdd = await ZweihanderUtils.findItemWorldWide(itemType, itemName);
    const existingItemWithSameName = actor.data.items.find(t => t.type === itemType && t.name === itemToAdd?.name);
    if (!itemToAdd && !existingItemWithSameName) return;
    const flag = { value: sourceType, label: `${sourceName} (${sourceType.capitalize()})` };
    if (existingItemWithSameName) {
      const existingFlag = existingItemWithSameName.getFlag('zweihander', 'source');
      if (existingFlag) {
        ui?.notifications.warn(`The ${existingItemWithSameName.type.capitalize()} "${existingItemWithSameName.name}" has been previously added by ${existingFlag.label}! Please contact your GM to replace this ${existingItemWithSameName.type} on ${flag.label}`);
        return;
      }
      await existingItemWithSameName.setFlag('zweihander', 'source', flag);
      return {kind: 'existing', id: existingItemWithSameName.id, name: existingItemWithSameName.name};
    } else {
      itemToAdd = itemToAdd.toObject();
      setProperty(itemToAdd, 'flags.zweihander.source', flag);
      return {kind: 'create', object: itemToAdd, name: itemToAdd.name};
    }
  }

  static async getOrCreateLinkedItem(actor, itemName, itemType, sourceName, sourceType) {
    const {kind, object, id, name} = ((await this._getOrCreateLinkedItem(actor, itemName, itemType, sourceName, sourceType)) ?? {});
    let linkedId = null;
    if (kind === 'existing') {
      linkedId = id;
    } else if (kind === 'create') {
      linkedId = await actor.createEmbeddedDocuments("Item", [object]).then(x => x[0].id);
    }
    return ({linkedId, value: name ?? itemName});
  }

  static async getOrCreateLinkedItems(actor, itemNames, itemType, sourceName, sourceType) {
    const itemsToCreate = [];
    const resultMap = {};
    for (let itemName of itemNames) {
      const normalizedItemName = ZweihanderUtils.normalizeName(itemName);
      const {kind, object, id, name} = ((await this._getOrCreateLinkedItem(actor, itemName, itemType, sourceName, sourceType)) ?? {});
      if (kind === 'existing') resultMap[normalizedItemName] = {linkedId: id, value: name};
      else if (kind === 'create') itemsToCreate.push(object);
      else resultMap[normalizedItemName] = {linkedId: null, value: itemName};
    }
    if (itemsToCreate.length) {
      await actor.createEmbeddedDocuments("Item", itemsToCreate)
        .then(x => x.forEach(y => resultMap[ZweihanderUtils.normalizeName(y.name)] = {linkedId: y.id, value: y.name}));
    }
    return itemNames.map(name => resultMap[ZweihanderUtils.normalizeName(name)]);
  }

  static async removeLinkedItem(actor, linkedId) {
    if (linkedId) {
      await actor.deleteEmbeddedDocuments("Item", [linkedId]);
    }
  }

  static async removeLinkedItems(actor, array) {
    const linkedIds = array?.filter(v => v);
    if (linkedIds.length) {
      await actor.deleteEmbeddedDocuments("Item", linkedIds);
    }
  }

  //TODO remove
  static async updateLinkedItemIds(array, linkedItems) {
    let i = 0;
    const result = [];
    for (item of array) {
      if (ZweihanderUtils.normalizedEquals(linkedItems[i].name, item.value)) {
        item.value = linkedItems[i].name;
        item.linkedId = linkedItems[i].id;
        i++;
      } else {
        item.linkedId = null;
      }
      result.push(item);
    }
    return result;
  }

  static getLinkedItemsDifference(newArray, oldArray) {
    const arrayMinusByName = (a, b) => a.filter(x => !b.some(y => x.value === y.value));
    return {
      namesToAdd: arrayMinusByName(newArray, oldArray).map(e => e.value),
      idsToDelete: arrayMinusByName(oldArray, newArray).map(e => e.linkedId)
    }
  }

  getRollData(rollData) {
    //TODO: make attributes more accessible here
    return rollData;
  }

}