import { ZWEI } from './config';
import { zhDebug, findItemWorldWide } from './utils';

export const migrateWorld = async (forceSystemPacks = false) => {
  ui.notifications.info(game.i18n.format('ZWEI.othermessages.migrationsystem', { version: game.system.version }), {
    permanent: true,
  });
  // Migrate World Actors
  for (let a of game.actors) {
    if (a.name.includes('skip')) {
      console.log('MIGRATION | Skipping Actor: ', a.name);
      continue;
    }

    try {
      const updateData = await migrateActorData(a);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Actor document ${a.name}`);
        await a.update(updateData, { enforceTypes: false });
      }
    } catch (err) {
      err.message = game.i18n.format('ZWEI.othermessages.migrationactor', { name: a.name, message: err.message });
      console.error(err);
    }
  }

  // Migrate World Items
  for (let i of game.items) {
    try {
      const updateData = await migrateItemData(i);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Item document ${i.name}`);
        await i.update(updateData, { enforceTypes: false });
      }
    } catch (err) {
      err.message = game.i18n.format('ZWEI.othermessages.migrationitem', { name: i.name, message: err.message });
      console.error(err);
    }
  }
  // Migrate Actor Override Tokens
  for (let s of game.scenes) {
    try {
      const updateData = await migrateSceneData(s);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Scene document ${s.name}`);
        await s.update(updateData, { enforceTypes: false });
        // If we do not do this, then synthetic token actors remain in cache
        // with the un-updated actorData.
        s.tokens.forEach((t) => (t._actor = null));
      }
    } catch (err) {
      err.message = game.i18n.format('ZWEI.othermessages.migrationscene', { name: s.name, message: err.message });
      console.error(err);
    }
  }

  // Migrate World Compendium Packs
  for (let p of game.packs) {
    if (p.metadata.package !== 'world' && !forceSystemPacks) continue;
    if (!['Actor', 'Item', 'Scene'].includes(p.documentName)) continue;
    await migrateCompendium(p);
  }

  // Set the migration as complete
  game.settings.set('zweihander', 'systemMigrationVersion', game.system.version);
  ui.notifications.info(game.i18n.format('ZWEI.othermessages.migrationversion', { version: game.system.version }), {
    permanent: true,
  });
};

const migrateCompendium = async (pack) => {
  const entity = pack.documentName;
  if (!['Actor', 'Item'].includes(entity)) return;

  // Unlock the pack for editing
  const wasLocked = pack.locked;
  await pack.configure({ locked: false });

  // Begin by requesting server-side data model migration and get the migrated content
  const documents = await pack.getDocuments();

  // Iterate over compendium entries - applying fine-tuned migration functions
  for (let doc of documents) {
    let updateData = {};
    try {
      switch (entity) {
        // case "Actor":
        //   updateData = migrateActorData(doc.toObject());
        //   break;
        case 'Item':
          updateData = await migrateItemData(doc);
          break;
      }

      // Save the entry, if data was changed
      if (foundry.utils.isEmpty(updateData)) continue;
      await doc.update(updateData);
      console.log(`Migrated ${entity} entity ${doc.name} in Compendium ${pack.collection}`);
    } catch (err) {
      // Handle migration failures
      err.message = game.i18n.format('ZWEI.othermessages.migrationfailed', {
        name: doc.name,
        pack: pack.collection,
        message: err.message,
      });
      console.error(err);
    }
  }
  await pack.migrate();

  // Apply the original locked status for the pack
  await pack.configure({ locked: wasLocked });
  console.log(`Migrated all ${entity} entities from Compendium ${pack.collection}`);
};

/**
 * Migrate a single Scene document to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {object} scene            The Scene data to Update
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}                The updateData to apply
 */
export const migrateSceneData = async (scene) => {
  const tokens = await Promise.all(
    scene.tokens.map(async (token) => {
      const t = token.toObject();
      const update = {};
      if (Object.keys(update).length) foundry.utils.mergeObject(t, update);
      if (!t.actorId || t.actorLink) {
        t.actorData = {};
      } else if (!game.actors.has(t.actorId)) {
        t.actorId = null;
        t.actorData = {};
      } else if (!t.actorLink) {
        const actorData = duplicate(t.actorData);
        actorData.type = token.actor?.type;
        const update = await migrateActorData(actorData);
        ['items', 'effects'].forEach((embeddedName) => {
          if (!update[embeddedName]?.length) return;
          const updates = new Map(update[embeddedName].map((u) => [u._id, u]));
          t.actorData[embeddedName].forEach((original) => {
            const update = updates.get(original._id);
            if (update) mergeObject(original, update);
          });
          delete update[embeddedName];
        });

        mergeObject(t.actorData, update);
      }
      return t;
    })
  );
  return { tokens };
};

const migrateFieldFactory =
  (documentDataObject, update) =>
  (oldKey, newKey, del = false, transform = false) => {
    oldKey = `system.${oldKey}`;
    newKey = `system.${newKey}`;
    let hasOldKey;
    try {
      hasOldKey = hasProperty(documentDataObject, oldKey);
    } catch (e) {
      hasOldKey = false;
    }
    if (hasOldKey) {
      const updateVal = getProperty(documentDataObject, oldKey);
      update[newKey] = transform ? transform(updateVal, documentDataObject) : updateVal;
      if (del) {
        const oldKeyDel = oldKey
          .split('.')
          .map((x, i, arr) => (i === arr.length - 1 ? `-=${x}` : x))
          .join('.');
        update[typeof del == 'string' ? `system.-=${del}` : `${oldKeyDel}`] = null;
      }
    }
  };

const migrateFieldFactoryAsync =
  (documentDataObject, update) =>
  async (oldKey, newKey, del = false, transform = false) => {
    oldKey = `system.${oldKey}`;
    newKey = `system.${newKey}`;
    let hasOldKey;
    try {
      hasOldKey = hasProperty(documentDataObject, oldKey);
    } catch (e) {
      hasOldKey = false;
    }
    if (hasOldKey) {
      const updateVal = getProperty(documentDataObject, oldKey);
      update[newKey] = transform ? await transform(updateVal, documentDataObject) : updateVal;
      if (del) {
        const oldKeyDel = oldKey
          .split('.')
          .map((x, i, arr) => (i === arr.length - 1 ? `-=${x}` : x))
          .join('.');
        update[typeof del == 'string' ? `system.-=${del}` : `${oldKeyDel}`] = null;
      }
    }
  };

const migrateActorData = async (actor) => {
  const update = {};
  // Actor Data Updates
  if (actor) {
    // future migrations might need this
    const actorData = typeof actor.toObject === 'function' ? actor.toObject() : actor;
    const migrateField = migrateFieldFactory(actorData, update);

    // ...actor migrations here...
  }
  // Migrate Owned Items
  if (!actor.items) return update;
  const items = [];
  for (let i of actor.items) {
    // Migrate the Owned Item
    let itemUpdate = await migrateItemData(i);
    // Update the Owned Item
    if (!isEmpty(itemUpdate)) {
      itemUpdate._id = i.id ?? i._id;
      items.push(expandObject(itemUpdate));
    }
  }
  if (items.length > 0) update.items = items;
  const updatedImg = migrateIcons(actor);
  if (updatedImg) {
    update.img = updatedImg;
  }
  return update;
};

const migrateItemData = async (item) => {
  const update = {};
  const itemData = typeof item.toObject === 'function' ? item.toObject() : item;
  const migrateField = migrateFieldFactory(itemData, update);
  const migrateFieldAsync = migrateFieldFactoryAsync(itemData, update);

  // type specific
  if (item.type === 'ancestry') {
    if (itemData.system.ancestralTrait.name !== '') {
      await migrateFieldAsync('ancestralTrait', 'ancestralTrait', 0, async (x) => {
        const ancestralTraitItem = await findItemWorldWide('trait', x.name);

        return { ...x, uuid: ancestralTraitItem?.uuid ?? '' };
      });
    }
  } else if (item.type === 'profession') {
    if (itemData.system.bonusAdvances.length) {
      migrateField('bonusAdvances', 'bonusAdvances', 0, (x) =>
        x.map((y) => {
          y.purchased = y?.purchased ?? false;
          return y;
        })
      );
    }
    if (itemData.system.professionalTrait.name !== '') {
      await migrateFieldAsync('professionalTrait', 'professionalTrait', 0, async (x) => {
        const professionalTraitItem = await findItemWorldWide('trait', x.name);

        return { ...x, uuid: professionalTraitItem?.uuid ?? '' };
      });
    }
    if (itemData.system.specialTrait.name !== '') {
      await migrateFieldAsync('specialTrait', 'specialTrait', 0, async (x) => {
        const specialTraitItem = await findItemWorldWide('trait', x.name);

        return { ...x, uuid: specialTraitItem?.uuid ?? '' };
      });
    }
    if (itemData.system.drawback.name !== '') {
      await migrateFieldAsync('drawback', 'drawback', 0, async (x) => {
        const drawbackItem = await findItemWorldWide('drawback', x.name);

        return { ...x, uuid: drawbackItem?.uuid ?? '' };
      });
    }
    if (itemData.system.talents.length) {
      await migrateFieldAsync('talents', 'talents', 0, async (x) => {
        const talentResults = x.map(async (y) => {
          const talentItem = await findItemWorldWide('talent', y.name);
          y.uuid = talentItem.uuid;
          return y;
        });

        return await Promise.all(talentResults);
      });
    }
    if (itemData.system.skillRanks.length) {
      migrateField('skillRanks', 'skillRanks', 0, (x) =>
        x.map((y) => {
          y.purchased = y?.purchased ?? false;
          return y;
        })
      );
    }
    if (itemData.system.expert.value) {
      const profession = await findItemWorldWide('profession', itemData.name);
      const additionalReqs = profession.system.expert.requirements?.additional;
      const srReqs = profession.system.expert.requirements?.skillRanks;

      migrateField('expert.requirements', 'expert.requirements', 0, () => ({
        additional: additionalReqs ?? '',
        skillRanks: srReqs.length ? [...srReqs] : [],
      }));
    } else {
      migrateField('expert.requirements', 'expert.requirements', 0, () => ({ additional: '', skillRanks: [] }));
    }
  } else if (item.type === 'disease') {
    migrateField('duration', 'duration', 0, () => ({ value: '', lastsUntilCured: false }));
  }
  const updatedImg = migrateIcons(item);
  if (updatedImg) {
    update.img = updatedImg;
  }

  return update;
};

const migrateIcons = (document) => {
  return undefined;
};

export const migrateWorldSafe = async () => {
  zhDebug('migrateWorldSafe');

  if (!game.user.isGM) return;
  const currentVersion = game.settings.get('zweihander', 'systemMigrationVersion');
  const NEEDS_MIGRATION_VERSION = '5.4.1'; // @todo: change for release
  const COMPATIBLE_MIGRATION_VERSION = '5.4.1';
  const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
  if (!currentVersion && totalDocuments === 0)
    return game.settings.set('zweihander', 'systemMigrationVersion', game.system.version);
  const needsMigration = !currentVersion || isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);

  console.log(
    'MIGRATION | Current V:',
    currentVersion,
    ' | isNewerVersion: ',
    isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion)
  );

  if (!needsMigration) return;

  // Perform the migration
  if (currentVersion && isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion)) {
    const warning = game.i18n.localize('ZWEI.othermessages.systemold');
    ui.notifications.error(warning, { permanent: true });
  }
  await migrateWorld();
};

const MIGRATION_REGISTRY = 'migrationsRegistry';

export const performWorldMigrations = async () => {
  if (!game.user.isGM) return;

  zhDebug('performing world migrations');

  await migrateWorldSafe();

  const registry = game.settings.get('zweihander', MIGRATION_REGISTRY);
  game.settings.set('zweihander', MIGRATION_REGISTRY, { ...registry, lastSystemVersion: game.system.version });
};

export const migrations = {
  performWorldMigrations,
};
