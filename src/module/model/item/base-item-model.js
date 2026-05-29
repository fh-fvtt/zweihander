import { rollTest } from '../../system/rolls/dice';
import { getItemRollConfiguration } from '../../system/rolls/test-config';

const { BooleanField, DocumentUUIDField, DocumentIdField, HTMLField, NumberField, StringField, TypedObjectField } =
  foundry.data.fields;
const { TypeDataModel } = foundry.abstract;
const { setProperty } = foundry.utils;

export default class ZweihanderBaseItemModel extends TypeDataModel {
  static linkedSingleProperties = [];
  static linkedListProperties = [];

  /** @override */
  static defineSchema() {
    return {
      description: new TypedObjectField(new HTMLField({ initial: '' }), {
        validateKey: (key) => typeof key === 'string' && key.startsWith('@'),
      }),
      notes: new TypedObjectField(new HTMLField({ initial: '' }), {
        validateKey: (key) => typeof key === 'string' && key.startsWith('@'),
      }),
    };
  }

  // ---=== SCHEMA GETTERS ===---

  static get _trappingFields() {
    return {
      price: new TypedObjectField(
        new NumberField(
          { integer: true, initial: 0, nullable: false },
          { validateKey: (key) => typeof key === 'string' && key.trim().length > 0 }
        )
      ),
      encumbrance: new NumberField({ integer: true, initial: 0, min: 0 }),
      carried: new BooleanField({ initial: true }),
    };
  }

  static get _effectFields() {
    return {
      effect: new TypedObjectField(new HTMLField({ initial: '' }), {
        validateKey: (key) => typeof key === 'string' && key.startsWith('@'),
      }),
    };
  }

  static get _linkedDocumentFields() {
    return {
      name: new StringField({ initial: '' }),
      linkedId: new DocumentIdField({ initial: null, readonly: false }),
      uuid: new DocumentUUIDField({ initial: '', blank: true }),
    };
  }

  static get _qualitiesFields() {
    return new DocumentUUIDField({ initial: '', blank: true });
  }

  static get _detailsFields() {
    return {
      category: new TypedObjectField(new StringField({ initial: '' }), {
        validateKey: (key) => typeof key === 'string' && key.startsWith('@'),
      }),
    };
  }

  static get _formulaFields() {
    return {
      number: new NumberField({ integer: true, initial: 1, min: 0 }),
      die: new StringField({ initial: 'd6' }),
      bonus: new NumberField({ integer: true, initial: 0 }),
    };
  }

  // ---=== HELPER METHODS ===---

  async roll() {
    const item = this.parent;

    if (!['weapon', 'spell', 'ritual'].includes(item.type)) return;

    const { skillItem, additionalConfiguration } = getItemRollConfiguration(item);

    await rollTest(skillItem, item.type, additionalConfiguration, {
      showDialog: true,
    });
  }

  // ---=== HELPER METHODS (MISC.) ===---
  // All of the methods below are used for the processing of Items associated with a parent Item (e.g. Talents associated with a Profession).
  // All processing regarding Item creation is based on UUIDs.

  static cleanLinkedItemEntry = (x) => ({ ...x, itemToCreate: undefined });
  static addPurchaseInfo = (x) => ({ ...x, purchased: false });

  static linkedItemEntryCreationProcessor =
    (source) =>
    async (property, itemType, entryPostProcessor = ZweihanderBaseItemModel.cleanLinkedItemEntry) => {
      const itemUuid = source.system[property].uuid;
      if (itemUuid) {
        const linkedItemEntry = await ZweihanderBaseItemModel.getLinkedItemEntry(
          source.parent,
          itemUuid,
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
    async (property, itemType, entryPostProcessor = ZweihanderBaseItemModel.cleanLinkedItemEntry) => {
      const itemUuids = source.system[property].map((v) => v.uuid);
      if (itemUuids.length) {
        let start = Date.now();

        const linkedItemEntries = await ZweihanderBaseItemModel.getLinkedItemEntries(
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
    async (property, itemType, entryPostProcessor = ZweihanderBaseItemModel.cleanLinkedItemEntry) => {
      if (changed.system[property]?.uuid !== undefined) {
        const newPropertyUuid = changed.system[property].uuid;
        const oldPropertyUuid = source.system[property].uuid;
        if (newPropertyUuid !== oldPropertyUuid) {
          const idToDelete = source.system[property].linkedId;
          const entry = await ZweihanderBaseItemModel.getLinkedItemEntry(
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
    async (property, itemType, entryPostProcessor = ZweihanderBaseItemModel.cleanLinkedItemEntry) => {
      if (changed.system[property] !== undefined) {
        const { idsToDelete, uuidsToAdd } = ZweihanderBaseItemModel.getLinkedItemsDifference(
          changed.system[property],
          source.system[property]
        );
        const addedEntries = await ZweihanderBaseItemModel.getLinkedItemEntries(
          source.parent,
          uuidsToAdd,
          itemType,
          source.name,
          source.type
        );
        const itemsToCreate = addedEntries.map((x) => x.itemToCreate).filter((x) => x !== undefined);

        const getIdentifier = (i) => {
          return i.linkedId == null && i.name && !i.uuid ? i.name : i.uuid;
        };

        // update names & linkedIds
        const lookUp = addedEntries.reduce((a, b) => {
          const key = getIdentifier(b);
          return { ...a, [key]: entryPostProcessor(b) };
        }, {});

        changed.system[property] = changed.system[property].map((t) => {
          const key = getIdentifier(t);
          return lookUp[key] ? lookUp[key] : t;
        });

        return { idsToDelete, itemsToCreate };
      }
    };

  static async getLinkedItemEntry(actor, itemUuid, itemType, sourceName, sourceType) {
    const itemToCreate = (await fromUuid(itemUuid))?.toObject?.();

    const existingItemWithSameName = actor.items.find((t) => t.type === itemType && t.name === itemToCreate?.name);
    const identifier = itemToCreate?.name ? itemToCreate.name : itemUuid ? itemUuid : '';
    const notFoundValue = { linkedId: null, name: identifier, uuid: '' };

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
      itemUuids.map((itemUuid) =>
        ZweihanderBaseItemModel.getLinkedItemEntry(actor, itemUuid, itemType, sourceName, sourceType)
      )
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
      uuidsToAdd: arrayMinusByName(newArray, oldArray).map((e) => (e.uuid ? e.uuid : e.name)),
      idsToDelete: arrayMinusByName(oldArray, newArray)
        .filter((e) => e.linkedId !== null)
        .map((e) => e.linkedId),
    };
  }

  async _prepareLinkedItems() {
    const item = this.parent;

    if (!this.constructor.linkedListProperties.length && !this.constructor.linkedSingleProperties.length) {
      return;
    }

    const processMultiLinkedPropertyDiff = ZweihanderBaseItemModel.linkedItemEntriesCreationProcessor(item);
    const processSingleLinkedPropertyDiff = ZweihanderBaseItemModel.linkedItemEntryCreationProcessor(item);

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

    // required to preserve insertion order for item lists
    itemsToCreate.forEach((item) => (item.sort = 0));

    return itemsToCreate;
  }

  async _updateLinkedItems(changed) {
    const item = this.parent;

    if (!this.constructor.linkedListProperties.length && !this.constructor.linkedSingleProperties.length) {
      return;
    }

    const processMultiLinkedPropertyDiff = ZweihanderBaseItemModel.linkedItemEntriesUpdateProcessor(item, changed);
    const processSingleLinkedPropertyDiff = ZweihanderBaseItemModel.linkedItemEntryUpdateProcessor(item, changed);

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

    return { itemsToCreate, idsToDelete };
  }

  async _deleteLinkedItems() {
    const item = this.parent;

    if (!this.constructor.linkedListProperties.length && !this.constructor.linkedSingleProperties.length) {
      return;
    }

    const singleLinkedIdsToDelete = this.constructor.linkedSingleProperties.map(
      ({ property }) => item.system[property].linkedId
    );

    const listLinkedIdsToDelete = this.constructor.linkedListProperties.flatMap(({ property }) =>
      item.system[property].map((x) => x.linkedId)
    );

    return singleLinkedIdsToDelete.concat(listLinkedIdsToDelete);
  }

  // ---=== MISC. METHODS ===---
  // subclasses can override to inject additional logic in _pre* methods for cases where Item is owned by an Actor

  async _preCreateWithParent(item, actor) {}

  async _preUpdateWithParent(changed, item, actor) {}

  // ---=== FOUNDRY METHODS ===---

  /** @override */
  async _preCreate(data, options, user) {
    let allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const item = this.parent;
    const actor = item.actor;

    if (!item.img || CONFIG.ZWEI.replacedDefaultCoreIcons.includes(item.img)) {
      const img = CONFIG.ZWEI.defaultItemIcons[item.type] ?? ZWEI.defaultItemIcons._default;
      await item.updateSource({ img });
    }

    if (!actor) return;

    allowed = await this._preCreateWithParent(item, actor);
    if (allowed === false) return false;

    options.itemsToCreate = await this._prepareLinkedItems();
  }

  /** @override */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    if (userId !== game.userId) return;

    const item = this.parent;

    if (options.itemsToCreate?.length) {
      Item.create(options.itemsToCreate, {
        parent: item.parent,
        keepId: true,
      }).catch((reason) => console.log(`zweihander | ${reason}`));
    }
  }

  /** @override */
  async _preUpdate(changed, options, user) {
    let allowed = await super._preUpdate(changed, options, user);
    if (allowed === false) return false;

    const item = this.parent;
    const actor = item.actor;

    if (!actor || !changed.system) return;

    allowed = await this._preUpdateWithParent(changed, item, actor);
    if (allowed === false) return false;

    Object.assign(options, await this._updateLinkedItems(changed));
  }

  /** @override */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (userId !== game.userId) return;

    const item = this.parent;

    if (!changed.system) return;

    if (options.itemsToCreate?.length) {
      Item.create(options.itemsToCreate, {
        parent: item.parent,
        keepId: true,
      }).catch((reason) => console.log(`zweihander | ${reason}`));
    }

    if (options.idsToDelete?.length) {
      ZweihanderBaseItemModel.removeLinkedItems(item.parent, options.idsToDelete).catch((reason) =>
        console.log(`zweihander | ${reason}`)
      );
    }
  }

  /** @override */
  async _preDelete(options, user) {
    const allowed = await super._preDelete(options, user);
    if (allowed === false) return false;

    options.idsToDelete = await this._deleteLinkedItems();
  }

  /** @override */
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    if (userId !== game.userId) return;

    const item = this.parent;

    ZweihanderBaseItemModel.removeLinkedItems(item.parent, options.idsToDelete).catch((reason) =>
      console.log(`zweihander | ${reason}`)
    );
  }

  /** @override */
  getRollData() {
    const rollData = super.getRollData();
    // @todo: make attributes more accessible here
    return rollData;
  }
}
