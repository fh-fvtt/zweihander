import { ZWEI } from '../system/config';
import { zhDebug, findItemWorldWide } from '../system/utils';

const { getProperty, hasProperty, isNewerVersion, mergeObject, isEmpty, expandObject, duplicate } = foundry.utils;

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
      if (!isEmpty(updateData)) {
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
      if (!isEmpty(updateData)) {
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
      if (!isEmpty(updateData)) {
        console.log(`Migrating Scene document ${s.name}`);
        await s.update(updateData, { enforceTypes: false, render: false });
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
  ui.notifications.success(game.i18n.format('ZWEI.othermessages.migrationversion', { version: game.system.version }), {
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
        case 'Actor':
          updateData = await migrateActorData(doc.toObject());
          break;
        case 'Item':
          updateData = await migrateItemData(doc);
          break;
      }

      // Save the entry, if data was changed
      if (isEmpty(updateData)) continue;
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
export const migrateSceneData = async (scene, migrationData) => {
  const tokens = scene.tokens.reduce((arr, token) => {
    const t = token instanceof foundry.abstract.DataModel ? token.toObject() : token;
    const update = {};
    if (!game.actors.has(t.actorId)) update.actorId = null;
    if (!foundry.utils.isEmpty(update)) arr.push({ ...update, _id: t._id });
    return arr;
  }, []);
  if (tokens.length) return { tokens };
  return {};
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

const migrateFlagFactoryAsync =
  (documentDataObject, update) =>
  async (oldKey, newKey, del = false, transform = false) => {
    oldKey = `flags.zweihander.${oldKey}`;
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
        update[typeof del == 'string' ? `flags.zweihander.${del}` : `${oldKey}`] = _del;
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
    const migrateFlag = migrateFlagFactoryAsync(actorData, update);

    if (actor.type === 'character') {
      const actorConfig = actorData.flags?.zweihander?.actorConfig;
      console.log(`${actor.name}: ACTOR CONFIG PRESENT:`, actorConfig && !isEmpty(actorConfig));
      if (actorConfig && !isEmpty(actorConfig)) {
        const keysToMigrate = [
          'dthAttribute',
          'pthAttribute',
          'intAttribute',
          'movAttribute',
          'isIgnoredPerilLadderValue',
          'encumbranceModifier',
          'initiativeModifier',
          'initiativeOverride',
          'movementModifier',
          'parrySkills',
          'dodgeSkills',
          'magickSkills',
          'perilSkills',
          'isMagickUser',
          'permanentChaosRanks',
          'permanentOrderRanks',
          'headerBackground',
          'dodgeSound',
          'parrySound',
          'gruntSound',
          'playGruntSound',
        ];

        for (const key of keysToMigrate) {
          await migrateFlag(`actorConfig.${key}`, `settings.${key}`, 0);
        }

        update['flags.zweihander.actorConfig'] = _del;
      }
    } else if (actor.type === 'creature' || actor.type === 'npc') {
      const actorConfig = actorData.flags?.zweihander?.actorConfig;
      if (actorConfig && !isEmpty(actorConfig)) {
        const keysToMigrate = ['initiativeOverride', 'dodgeSound', 'parrySound', 'gruntSound', 'playGruntSound'];

        for (const key of keysToMigrate) {
          await migrateFlag(`actorConfig.${key}`, `settings.${key}`, 0);
        }

        update['flags.zweihander.actorConfig'] = _del;
      }
    }

    console.log(`${actor.name} UPDATE DATA:`, update);
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
  // ... item migrations here ...

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
  const NEEDS_MIGRATION_VERSION = '5.7.4'; // @todo: change for release
  const COMPATIBLE_MIGRATION_VERSION = '5.7.3';
  const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
  if (!currentVersion && totalDocuments === 0)
    return await game.settings.set('zweihander', 'systemMigrationVersion', game.system.version);
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
