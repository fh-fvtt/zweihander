import { ZWEI } from "./config";

export const migrateWorld = async (forceSystemPacks=false) => {
  ui.notifications.info(`Applying Zweihander System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`, { permanent: true });
  // Migrate World Actors
  for (let a of game.actors) {
    try {
      const updateData = await migrateActorData(a);
      if (!foundry.utils.isObjectEmpty(updateData)) {
        console.log(`Migrating Actor document ${a.name}`);
        await a.update(updateData, { enforceTypes: false });
      }
    } catch (err) {
      err.message = `Failed Zweihander system migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Items
  for (let i of game.items) {
    try {
      const updateData = await migrateItemData(i);
      if (!foundry.utils.isObjectEmpty(updateData)) {
        console.log(`Migrating Item document ${i.name}`);
        await i.update(updateData, { enforceTypes: false });
      }
    } catch (err) {
      err.message = `Failed Zweihander system migration for Item ${i.name}: ${err.message}`;
      console.error(err);
    }
  }
  // Migrate Actor Override Tokens
  for ( let s of game.scenes ) {
    try {
      const updateData = migrateSceneData(s.data);
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Scene document ${s.name}`);
        await s.update(updateData, {enforceTypes: false});
        // If we do not do this, then synthetic token actors remain in cache
        // with the un-updated actorData.
        s.tokens.forEach(t => t._actor = null);
      }
    } catch(err) {
      err.message = `Failed Zweihander system migration for Scene ${s.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Compendium Packs
  for (let p of game.packs) {
    if (p.metadata.package !== "world" && !forceSystemPacks) continue;
    if (!["Actor", "Item", "Scene"].includes(p.documentName)) continue;
    await migrateCompendium(p);
  }

  // Set the migration as complete
  game.settings.set("zweihander", "systemMigrationVersion", game.system.data.version);
  ui.notifications.info(`Zweihander System Migration to version ${game.system.data.version} completed!`, { permanent: true });
};

const migrateCompendium = async (pack) => {
  const entity = pack.documentName;
  if (!["Actor", "Item"].includes(entity)) return;

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
        case "Item":
          updateData = await migrateItemData(doc);
          break;
      }

      // Save the entry, if data was changed
      if (foundry.utils.isObjectEmpty(updateData)) continue;
      await doc.update(updateData);
      console.log(`Migrated ${entity} entity ${doc.name} in Compendium ${pack.collection}`);
    }

    // Handle migration failures
    catch (err) {
      err.message = `Failed Zweihander system migration for entity ${doc.name} in pack ${pack.collection}: ${err.message}`;
      console.error(err);
    }
  }
  await pack.migrate();

  // Apply the original locked status for the pack
  await pack.configure({ locked: wasLocked });
  console.log(`Migrated all ${entity} entities from Compendium ${pack.collection}`);
}

/**
 * Migrate a single Scene document to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {object} scene            The Scene data to Update
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}                The updateData to apply
 */
 export const migrateSceneData = function(scene) {
  const tokens = scene.tokens.map(token => {
    const t = token.toObject();
    const update = {};
    if ( Object.keys(update).length ) foundry.utils.mergeObject(t, update);
    if ( !t.actorId || t.actorLink ) {
      t.actorData = {};
    }
    else if ( !game.actors.has(t.actorId) ) {
      t.actorId = null;
      t.actorData = {};
    }
    else if ( !t.actorLink ) {
      const actorData = duplicate(t.actorData);
      actorData.type = token.actor?.type;
      const update = migrateActorData(actorData);
      ["items", "effects"].forEach(embeddedName => {
        if (!update[embeddedName]?.length) return;
        const updates = new Map(update[embeddedName].map(u => [u._id, u]));
        t.actorData[embeddedName].forEach(original => {
          const update = updates.get(original._id);
          if (update) mergeObject(original, update);
        });
        delete update[embeddedName];
      });

      mergeObject(t.actorData, update);
    }
    return t;
  });
  return {tokens};
};

const migrateFieldFactory = (documentDataObject, update) => (oldKey, newKey, del = false, transform = false) => {
  oldKey = `data.${oldKey}`;
  newKey = `data.${newKey}`;
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
      const oldKeyDel = oldKey.split('.').map((x, i, arr) => (i === arr.length - 1) ? `-=${x}` : x).join('.');
      update[(typeof del == "string") ? `data.-=${del}` : `${oldKeyDel}`] = null;
    }
  }
}

const migrateActorData = async (actor) => {
  const update = {};
  // Actor Data Updates
  if (actor.data) {
    // future migrations might need this
    const actorData = (typeof actor.toObject === 'function') ? actor.toObject() : actor;
    const migrateField = migrateFieldFactory(actorData, update);
    // currency
    migrateField('coinage.gold', 'currency.gc');
    migrateField('coinage.silver', 'currency.ss');
    migrateField('coinage.brass', 'currency.bp', 'coinage');
    // details
    migrateField('details.socialClass.value', 'details.socialClass', 'details.socialClass');
    migrateField('socialClass.value', 'details.socialClass', 'socialClass');
    migrateField('seasonOfBirth.value', 'details.seasonOfBirth', 'seasonOfBirth');
    migrateField('dooming.value', 'details.dooming', 'dooming');
    migrateField('physical.distinguishingMarks.value', 'details.distinguishingMarks');
    migrateField('details.distinguishingMarks.value', 'details.distinguishingMarks', 'details.distinguishingMarks');
    migrateField('upbringing.value', 'details.upbringing', 'upbringing');
    migrateField('orderAlignment.value', 'alignment.order.name', 'orderAlignment');
    migrateField('chaosAlignment.value', 'alignment.chaos.name', 'chaosAlignment');
    migrateField('orderRanks.value', 'alignment.order.rank', 'orderRanks');
    migrateField('chaosRanks.value', 'alignment.chaos.rank', 'chaosRanks');
    migrateField('corruption.value', 'alignment.corruption', 'corruption');
    migrateField('physical.age.value', 'details.age');
    migrateField('physical.sex.value', 'details.sex');
    migrateField('physical.height.value', 'details.height');
    migrateField('physical.weight.value', 'details.weight');
    migrateField('physical.hairColor.value', 'details.hairColor');
    migrateField('physical.eyeColor.value', 'details.eyeColor');
    migrateField('physical.complexion.value', 'details.complexion');
    migrateField('physical.buildType.value', 'details.buildType', 'physical');
    migrateField('fate.value', 'stats.fate', 'fate');
    migrateField('reputation.value', 'stats.reputation', 'reputation');
    migrateField('rewardPoints', 'stats.rewardPoints', 'rewardPoints');
    migrateField('details.classification.value', 'details.classification', 'details.classification');
    migrateField('details.size.value', 'details.size', 'details.size');
    migrateField('details.role.value', 'details.role', 'details.role');
    migrateField('details.influences.value', 'details.influences', 'details.influences');
    migrateField('details.ancestry.value', 'details.ancestry', 'details.ancestry');
    migrateField('details.archetype.value', 'details.archetype', 'details.archetype');
    migrateField('details.age.value', 'details.age', 'details.age');
    migrateField('details.sex.value', 'details.sex', 'details.sex');
    migrateField('details.height.value', 'details.height', 'details.height');
    migrateField('details.build.value', 'details.build', 'details.build');
    migrateField('details.complexion.value', 'details.complexion', 'details.complexion');
    migrateField('details.persona.value', 'details.persona', 'details.persona');
    migrateField('details.motivation.value', 'details.motivation', 'details.motivation');
    migrateField('details.alignment.value', 'details.alignment', 'details.alignment');
    migrateField('details.mannerOfDress.value', 'details.mannerOfDress', 'details.mannerOfDress');
    // languages
    migrateField('languages.value', 'languages', true, (x) =>
      x.split(',').map(y => ({ name: y.split('(')[0].trim(), isLiterate: y.match(/\(\s*literate\s*\)/i) !== null }))
    );
    // flavor
    migrateField('flavor.description', 'description.@en');
    migrateField('flavor.notes', 'notes', 'flavor');
  }
  // Migrate Owned Items
  if (!actor.items) return update;
  const items = [];
  for (let i of actor.items) {
    // Migrate the Owned Item
    let itemUpdate = await migrateItemData(i);
    // Update the Owned Item
    if (!isObjectEmpty(itemUpdate)) {
      itemUpdate._id = i.id;
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
  const itemData = (typeof item.toObject === 'function') ? item.toObject() : item;
  const migrateField = migrateFieldFactory(itemData, update);
  // all effects
  migrateField('effect.criticalSuccess.value', 'rules.criticalSuccess.@en');
  migrateField('effect.criticalSuccess', 'rules.criticalSuccess.@en');
  migrateField('effect.criticalFailure.value', 'rules.criticalFailure.@en');
  migrateField('effect.criticalFailure', 'rules.criticalFailure.@en');
  migrateField('effect.value', 'rules.effect.@en', 'effect');

  // all flavors
  migrateField('flavor.description', 'description.@en');
  migrateField('flavor.notes', 'notes', 'flavor');

  // other long text rules
  migrateField('treatment.value', 'rules.treatment.@en', 'treatment');
  migrateField('consequences.value', 'rules.consequences.@en', 'consequences');
  migrateField('condition.value', 'rules.condition.@en', 'condition');
  migrateField('reagents.value', 'rules.reagents.@en', 'reagents');

  // type specific
  if (item.type === 'ancestry') {
    migrateField('ancestralTrait.value', 'ancestralTrait.name', 1);    
  } else if (item.type === 'profession') {
    migrateField('drawback.value', 'drawback.name', 1);
    migrateField('specialTrait.value', 'specialTrait.name', 1);
    migrateField('professionalTrait.value', 'professionalTrait.name', 1);
    if (itemData.data.bonusAdvances.length && itemData.data.bonusAdvances[0].value) {
      migrateField('bonusAdvances', 'bonusAdvances', 0, (x) => x.map(y=>{
        y.name = y.value;
        delete y.value;
        return y;
      }));
    }
    if (itemData.data.talents.length && itemData.data.talents[0].value) {
      migrateField('talents', 'talents', 0, (x) => x.map(y=>{
        y.name = y.value;
        delete y.value;
        return y;
      }));
    }
    if (itemData.data.skillRanks.length && itemData.data.skillRanks[0].value) {
      migrateField('skillRanks', 'skillRanks', 0, (x) => x.map(y=>{
        y.name = y.value;
        delete y.value;
        return y;
      }));
    }
  } else if (item.type === 'weapon') {
    migrateField('type.value', 'weaponType', 'type');
  }
  const updatedImg = migrateIcons(item);
  if (updatedImg) {
    update.img = updatedImg;
  }
  return update;
};

const migrateIcons = (document) => {
  return undefined;
}

export const migrateWorldSafe = async () => {
  if (!game.user.isGM) return;
  const currentVersion = game.settings.get("zweihander", "systemMigrationVersion");
  const NEEDS_MIGRATION_VERSION = "4.2.3-beta1l";
  const COMPATIBLE_MIGRATION_VERSION = "4.2.0";
  const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
  if (!currentVersion && totalDocuments === 0) return game.settings.set("zweihander", "systemMigrationVersion", game.system.data.version);
  const needsMigration = !currentVersion || isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);
  if (!needsMigration) return;

  // Perform the migration
  if (currentVersion && isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion)) {
    const warning = "Your Zweihander system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.";
    ui.notifications.error(warning, { permanent: true });
  }
  await migrateWorld();
}