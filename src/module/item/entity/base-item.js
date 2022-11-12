import * as ZweihanderUtils from '../../utils';

export default class ZweihanderBaseItem {
  static linkedSingleProperties = [];

  static linkedListProperties = [];

  static cleanLinkedItemEntry = (x) => ({ ...x, itemToCreate: undefined });
  static addPurchaseInfo = (x) => ({ ...x, purchased: false });

  static linkedItemEntryCreationProcessor =
    (source) =>
    async (property, itemType, entryPostProcessor = ZweihanderBaseItem.cleanLinkedItemEntry) => {
      const itemName = source.system[property].name.trim();
      if (itemName) {
        const linkedItemEntry = await ZweihanderBaseItem.getLinkedItemEntry(
          source.parent,
          itemName,
          itemType,
          source.name,
          source.type
        );
        source.updateSource({
          [`system.${property}`]: entryPostProcessor(linkedItemEntry),
        });
        return linkedItemEntry.itemToCreate;
      }
    };

  static linkedItemEntriesCreationProcessor =
    (source) =>
    async (property, itemType, entryPostProcessor = ZweihanderBaseItem.cleanLinkedItemEntry) => {
      const itemNames = source.system[property].map((v) => v.name);
      if (itemNames.length) {
        const linkedItemEntries = await ZweihanderBaseItem.getLinkedItemEntries(
          source.parent,
          itemNames,
          itemType,
          source.name,
          source.type
        );
        source.updateSource({
          [`system.${property}`]: linkedItemEntries.map(entryPostProcessor),
        });
        const itemsToCreate = linkedItemEntries.map((x) => x.itemToCreate).filter((x) => x !== undefined);
        return itemsToCreate;
      }
      return [];
    };

  static linkedItemEntryUpdateProcessor =
    (source, changed) =>
    async (property, itemType, entryPostProcessor = ZweihanderBaseItem.cleanLinkedItemEntry) => {
      if (changed.system[property]?.name !== undefined) {
        const newPropertyName = changed.system[property].name.trim();
        const oldPropertyName = source.system[property].name;
        if (newPropertyName !== oldPropertyName) {
          const idToDelete = source.system[property].linkedId;
          const entry = await ZweihanderBaseItem.getLinkedItemEntry(
            source.parent,
            newPropertyName,
            itemType,
            source.name,
            source.type
          );
          changed.system[property] = entryPostProcessor(entry);
          return { idToDelete, itemToCreate: entry.itemToCreate };
        }
      }
    };

  static linkedItemEntriesUpdateProcessor =
    (source, changed) =>
    async (property, itemType, entryPostProcessor = ZweihanderBaseItem.cleanLinkedItemEntry) => {
      if (changed.system[property] !== undefined) {
        const { idsToDelete, namesToAdd } = ZweihanderBaseItem.getLinkedItemsDifference(
          changed.system[property],
          source.system[property]
        );
        const addedEntries = await ZweihanderBaseItem.getLinkedItemEntries(
          source.parent,
          namesToAdd,
          itemType,
          source.name,
          source.type
        );
        const itemsToCreate = addedEntries.map((x) => x.itemToCreate).filter((x) => x !== undefined);
        // update names & linkedIds
        const lookUp = addedEntries.reduce((a, b) => ({ ...a, [b.name]: entryPostProcessor(b) }), {});
        changed.system[property] = changed.system[property].map((t) => (lookUp[t.name] ? lookUp[t.name] : t));
        return { idsToDelete, itemsToCreate };
      }
    };

  static async getLinkedItemEntry(actor, itemName, itemType, sourceName, sourceType) {
    const itemToCreate = (await ZweihanderUtils.findItemWorldWide(itemType, itemName))?.toObject?.();
    const existingItemWithSameName = actor.items.find((t) => t.type === itemType && t.name === itemToCreate?.name);
    const notFoundValue = { linkedId: null, name: itemName };
    if (!itemToCreate && !existingItemWithSameName) return notFoundValue;
    const flag = {
      name: sourceType,
      label: `${sourceName} (${sourceType.capitalize()})`,
    };
    if (existingItemWithSameName) {
      const existingFlag = existingItemWithSameName.getFlag('zweihander', 'source');
      if (existingFlag) {
        ui?.notifications.warn(
          `The ${existingItemWithSameName.type.capitalize()} "${
            existingItemWithSameName.name
          }" has been previously added by ${existingFlag.label}! Please contact your GM to replace this ${
            existingItemWithSameName.type
          } on ${flag.label}`
        );
        return notFoundValue;
      }
      await existingItemWithSameName.setFlag('zweihander', 'source', flag);
      return {
        linkedId: existingItemWithSameName.id,
        name: existingItemWithSameName.name,
      };
    } else {
      setProperty(itemToCreate, 'flags.zweihander.source', flag);
      return {
        linkedId: itemToCreate._id,
        itemToCreate,
        name: itemToCreate.name,
      };
    }
  }

  static async getLinkedItemEntries(actor, itemNames, itemType, sourceName, sourceType) {
    return Promise.all(
      itemNames.map((itemName) => this.getLinkedItemEntry(actor, itemName, itemType, sourceName, sourceType))
    );
  }

  static async removeLinkedItem(actor, linkedId) {
    if (linkedId) {
      await actor.deleteEmbeddedDocuments('Item', [linkedId]);
    }
  }

  static async removeLinkedItems(actor, array) {
    const linkedIds = array?.filter?.((v) => v);
    if (linkedIds?.length) {
      await actor.deleteEmbeddedDocuments('Item', linkedIds);
    }
  }

  static getLinkedItemsDifference(newArray, oldArray) {
    const arrayMinusByName = (a, b) => a.filter((x) => !b.some((y) => x.name === y.name));
    return {
      namesToAdd: arrayMinusByName(newArray, oldArray).map((e) => e.name),
      idsToDelete: arrayMinusByName(oldArray, newArray).map((e) => e.linkedId),
    };
  }

  async _preCreate(data, options, user, item) {
    if (!this.constructor.linkedListProperties.length && !this.constructor.linkedSingleProperties.length) {
      return;
    }
    const processMultiLinkedPropertyDiff = ZweihanderBaseItem.linkedItemEntriesCreationProcessor(item);
    const processSingleLinkedPropertyDiff = ZweihanderBaseItem.linkedItemEntryCreationProcessor(item);
    const itemsToCreate = (
      await Promise.all(
        this.constructor.linkedListProperties.map(({ property, itemType, entryPostProcessor }) =>
          processMultiLinkedPropertyDiff(property, itemType, entryPostProcessor)
        )
      )
    ).flatMap((x) => x);

    (
      await Promise.all(
        this.constructor.linkedSingleProperties.map(({ property, itemType, entryPostProcessor }) =>
          processSingleLinkedPropertyDiff(property, itemType, entryPostProcessor)
        )
      )
    )
      .filter((x) => x !== undefined)
      .forEach((x) => itemsToCreate.push(x));
    options.itemsToCreate = itemsToCreate;
  }

  async _onCreate(data, options, user, item) {
    if (options.itemsToCreate?.length) {
      await Item.create(options.itemsToCreate, {
        parent: item.parent,
        keepId: true,
      });
    }
  }

  async _preUpdate(changed, options, user, item) {
    if (!this.constructor.linkedListProperties.length && !this.constructor.linkedSingleProperties.length) {
      return;
    }
    const processMultiLinkedPropertyDiff = ZweihanderBaseItem.linkedItemEntriesUpdateProcessor(item, changed);
    const processSingleLinkedPropertyDiff = ZweihanderBaseItem.linkedItemEntryUpdateProcessor(item, changed);
    const entries = (
      await Promise.all(
        this.constructor.linkedListProperties.map(({ property, itemType, entryPostProcessor }) =>
          processMultiLinkedPropertyDiff(property, itemType, entryPostProcessor)
        )
      )
    )
      .flatMap((x) => x)
      .concat(
        await Promise.all(
          this.constructor.linkedSingleProperties.map(({ property, itemType, entryPostProcessor }) =>
            processSingleLinkedPropertyDiff(property, itemType, entryPostProcessor)
          )
        )
      );
    const itemsToCreate = [];
    const idsToDelete = [];
    entries
      .filter((x) => x !== undefined)
      .forEach((x) => {
        if (x.itemToCreate) {
          itemsToCreate.push(x.itemToCreate);
        }
        if (x.itemsToCreate) {
          itemsToCreate.push(...x.itemsToCreate);
        }
        if (x.idToDelete) {
          idsToDelete.push(x.idToDelete);
        }
        if (x.idsToDelete) {
          idsToDelete.push(...x.idsToDelete);
        }
      });
    options.itemsToCreate = itemsToCreate;
    options.idsToDelete = idsToDelete;
  }

  async _onUpdate(changed, options, user, item) {
    if (options.itemsToCreate?.length) {
      await Item.create(options.itemsToCreate, {
        parent: item.parent,
        keepId: true,
      });
    }
    if (options.idsToDelete?.length) {
      await ZweihanderBaseItem.removeLinkedItems(item.parent, options.idsToDelete);
    }
  }

  async _preDelete(options, user, item) {
    if (!this.constructor.linkedListProperties.length && !this.constructor.linkedSingleProperties.length) {
      return;
    }
    const singleLinkedIdsToDelete = this.constructor.linkedSingleProperties.map(
      ({ property }) => item.system[property].linkedId
    );
    const listLinkedIdsToDelete = this.constructor.linkedListProperties.flatMap(({ property }) =>
      item.system[property].map((x) => x.linkedId)
    );
    options.idsToDelete = singleLinkedIdsToDelete.concat(listLinkedIdsToDelete);
  }

  async _onDelete(options, user, item) {
    await ZweihanderBaseItem.removeLinkedItems(item.parent, options.idsToDelete);
  }

  getRollData(rollData) {
    //TODO: make attributes more accessible here
    return rollData;
  }
}
