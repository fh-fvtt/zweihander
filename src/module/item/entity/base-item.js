import * as ZweihanderUtils from '../../utils';

export default class ZweihanderBaseItem {
  static linkedSingleProperties = [];

  static linkedListProperties = [];

  static cleanLinkedItemEntry = (x) => ({ ...x, itemToCreate: undefined });
  static addPurchaseInfo = (x) => ({ ...x, purchased: false });

  static linkedItemEntryCreationProcessor =
    (source) =>
    async (property, itemType, entryPostProcessor = ZweihanderBaseItem.cleanLinkedItemEntry) => {
      const itemUuid = source.system[property].uuid;
      if (itemUuid) {
        let start = Date.now();

        const linkedItemEntry = await ZweihanderBaseItem.getLinkedItemEntry(
          source.parent,
          itemUuid,
          itemType,
          source.name,
          source.type
        );
        let end = Date.now();

        console.log('FIND TIME (ENTRY):', end - start);
        source.updateSource({
          [`system.${property}`]: entryPostProcessor(linkedItemEntry),
        });
        return linkedItemEntry.itemToCreate;
      }
    };

  static linkedItemEntriesCreationProcessor =
    (source) =>
    async (property, itemType, entryPostProcessor = ZweihanderBaseItem.cleanLinkedItemEntry) => {
      const itemUuids = source.system[property].map((v) => v.uuid);
      if (itemUuids.length) {
        let start = Date.now();

        const linkedItemEntries = await ZweihanderBaseItem.getLinkedItemEntries(
          source.parent,
          itemUuids,
          itemType,
          source.name,
          source.type
        );

        let end = Date.now();

        console.log('FIND TIME (ENTRIES):', end - start);
        console.log('ITEMS CREATED:', linkedItemEntries);
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
      if (changed.system[property]?.uuid !== undefined) {
        const newPropertyUuid = changed.system[property].uuid;
        const oldPropertyUuid = source.system[property].uuid;
        if (newPropertyUuid !== oldPropertyUuid) {
          const idToDelete = source.system[property].linkedId;
          const entry = await ZweihanderBaseItem.getLinkedItemEntry(
            source.parent,
            newPropertyUuid,
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
        const { idsToDelete, uuidsToAdd } = ZweihanderBaseItem.getLinkedItemsDifference(
          changed.system[property],
          source.system[property]
        );
        const addedEntries = await ZweihanderBaseItem.getLinkedItemEntries(
          source.parent,
          uuidsToAdd,
          itemType,
          source.name,
          source.type
        );
        const itemsToCreate = addedEntries.map((x) => x.itemToCreate).filter((x) => x !== undefined);

        // update names & linkedIds
        const lookUp = addedEntries.reduce((a, b) => ({ ...a, [b.uuid]: entryPostProcessor(b) }), {});

        changed.system[property] = changed.system[property].map((t) => (lookUp[t.uuid] ? lookUp[t.uuid] : t));

        return { idsToDelete, itemsToCreate };
      }
    };

  static async getLinkedItemEntry(actor, itemUuid, itemType, sourceName, sourceType) {
    const itemToCreate = (await fromUuid(itemUuid))?.toObject?.();

    const existingItemWithSameName = actor.items.find((t) => t.type === itemType && t.name === itemToCreate?.name);
    const notFoundValue = { linkedId: null, name: itemToCreate?.name ?? '', uuid: '' };

    if (!itemToCreate && !existingItemWithSameName) return notFoundValue;

    const flag = {
      name: sourceType,
      label: `${sourceName} (${game.i18n.localize(CONFIG.Item.typeLabels[sourceType])})`,
    };

    if (existingItemWithSameName) {
      const existingFlag = existingItemWithSameName.getFlag('zweihander', 'source');

      if (existingFlag) {
        ui?.notifications.warn(
          game.i18n.format('ZWEI.othermessages.previouslyadded', {
            type: existingItemWithSameName.type.capitalize(),
            name: existingItemWithSameName.name,
            label: existingFlag.label,
            existing: existingItemWithSameName.type,
            flag: flag.label,
          })
        );

        return notFoundValue;
      }

      await existingItemWithSameName.setFlag('zweihander', 'source', flag);

      return {
        linkedId: existingItemWithSameName.id,
        name: existingItemWithSameName.name,
        uuid: itemUuid,
      };
    } else {
      setProperty(itemToCreate, 'flags.zweihander.source', flag);
      return {
        linkedId: itemToCreate._id,
        itemToCreate,
        name: itemToCreate.name,
        uuid: itemUuid,
      };
    }
  }

  static async getLinkedItemEntries(actor, itemUuids, itemType, sourceName, sourceType) {
    return Promise.all(
      itemUuids.map((itemUuid) => this.getLinkedItemEntry(actor, itemUuid, itemType, sourceName, sourceType))
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
    const arrayMinusByName = (a, b) =>
      a.filter((x) => !b.some((y) => x.uuid !== '' && y.uuid !== '' && x.uuid === y.uuid));
    return {
      uuidsToAdd: arrayMinusByName(newArray, oldArray).map((e) => e.uuid),
      idsToDelete: arrayMinusByName(oldArray, newArray).map((e) => e.linkedId),
    };
  }

  async _preCreate(data, options, user, item) {
    let start = Date.now();

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

    let end = Date.now();

    console.log('PRE-CREATE TIME:', end - start);
  }

  async _onCreate(data, options, user, item) {
    if (options.itemsToCreate?.length) {
      let start = Date.now();

      await Item.create(options.itemsToCreate, {
        parent: item.parent,
        keepId: true,
      });

      let end = Date.now();

      console.log('CREATE TIME:', end - start);
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
