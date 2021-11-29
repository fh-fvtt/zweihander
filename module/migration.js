import ZweihanderBaseItem from "./item/entity/base-item";

export const migrateWorld = async function () {
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

  // Migrate World Compendium Packs
  for (let p of game.packs) {
    // if (p.metadata.package !== "world") continue;
    if (!["Actor", "Item", "Scene"].includes(p.documentName)) continue;
    await migrateCompendium(p);
  }

  // Set the migration as complete
  game.settings.set("zweihander", "systemMigrationVersion", game.system.data.version);
  ui.notifications.info(`Zweihander System Migration to version ${game.system.data.version} completed!`, { permanent: true });
};

const migrateCompendium = async function (pack) {
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

const migrateActorData = async function (actor) {
  const updateData = {};
  // Actor Data Updates
  if (actor.data) {
    // future migrations might need this
  }
  // Migrate Owned Items
  if (!actor.items) return updateData;
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
  if (items.length > 0) updateData.items = items;
  return updateData;
};


export const migrateItemData = async function (item) {
  let updateData = {};
  const rmSource = ['trait', 'talent', 'drawback'];
  if (item.type === 'ancestry') {
    updateData = await migrateAncestry(item);
  } else if (item.type === 'profession') {
    updateData = await migrateProfession(item);
  } else if (rmSource.includes(item.type)) {
    // item.setFlag('zweihander', 'source', null);
  }
  return updateData;
};

const migrateAncestry = async function (item) {
  const actor = item.actor;
  item = item.toObject();
  let traitId = item.data.ancestralTrait.linkedId ?? null;
  let traitValue = item.data.ancestralTrait.value;
  if (actor) {
    if (traitValue && !traitId) {
      const trait = await ZweihanderBaseItem.getOrCreateLinkedItem(actor, traitValue, 'trait', item.name, 'ancestry');
      traitId = trait.linkedId;
      traitValue = trait.value;
    }
  }
  return {
    'data.ancestralTrait.value': traitValue,
    'data.ancestralTrait.linkedId': traitId,
    'data.ancestralModifiers.positive': item.data.ancestralModifiers.positive?.value?.split(',')?.map(v => v.trim()) ?? item.data.ancestralModifiers.positive,
    'data.ancestralModifiers.negative': item.data.ancestralModifiers.negative?.value?.split(',')?.map(v => v.trim()) ?? item.data.ancestralModifiers.negative
  }
}

const migrateProfession = async function (item) {
  const actor = item.actor;
  if (item.pack) {
    debugger;
  }
  item = item.toObject();
  let bonusAdvances = item.data.bonusAdvances?.arrayOfValues?.map(ba => ({ value: ba.name.trim(), purchased: ba.purchased }))
    ?? item.data.bonusAdvances?.value?.split(',')?.map(v => ({ value: v.trim(), purchased: false }))
    ?? item.data.bonusAdvances;
  let talents = item.data.talents?.arrayOfValues?.map(t => ({ value: t.name.trim(), linkedId: null, purchased: t.purchased }))
    ?? item.data.talents?.value?.split(',')?.map(v => ({ value: v.trim(), linkedId: null, purchased: false }))
    ?? item.data.talents.map(t => ({ value: t.value.trim(), linkedId: t.linkedId ?? null, purchased: t.purchased }));
  const actorTier = actor?.data?.data?.tier;
  const profTier = item.data.tier?.value;
  const purchaseAll = actorTier && actorTier !== profTier;
  let skillRanks = item.data.skillRanks?.arrayOfValues?.map(sr => ({ value: sr.name.trim(), purchased: purchaseAll || sr.timesAvailable === 0 }))
    ?? item.data.skillRanks?.value?.split(',')?.map(v => ({ value: v.trim(), purchased: false }))
    ?? item.data.skillRanks;
  let professionalTraitValue = item.data.professionalTrait.value;
  let professionalTraitId = item.data.professionalTrait.linkedId ?? null;
  let specialTraitValue = item.data.specialTrait.value;
  let specialTraitId = item.data.specialTrait.linkedId ?? null;
  let drawbackValue = item.data.drawback.value;
  let drawbackId = item.data.drawback.linkedId ?? null;
  if (actor) {
    let i;
    if (professionalTraitValue && !professionalTraitId) {
      i = await ZweihanderBaseItem.getOrCreateLinkedItem(actor, professionalTraitValue, 'trait', item.name, 'profession');
      professionalTraitValue = i.value;
      professionalTraitId = i.linkedId;
    }
    if (specialTraitValue && !specialTraitId) {
      i = await ZweihanderBaseItem.getOrCreateLinkedItem(actor, specialTraitValue, 'trait', item.name, 'profession');
      specialTraitValue = i.value;
      specialTraitId = i.linkedId;
    }
    if (drawbackValue && !drawbackId) {
      i = await ZweihanderBaseItem.getOrCreateLinkedItem(actor, drawbackValue, 'drawback', item.name, 'profession');
      drawbackValue = i.value;
      drawbackId = i.linkedId;
    }
    // const talentNames = talents.map(t => t.value);
    const talentNames = talents.filter(t => !t.linkedId && t.value).map(t => t.value);
    if (talentNames.length) {
      i = await ZweihanderBaseItem.getOrCreateLinkedItems(actor, talentNames, 'talent', item.name, 'profession');
      talents = i.map((t, j) => ({ ...t, purchased: talents[j].purchased || false }));
    }
  }
  return {
    'data.bonusAdvances': bonusAdvances,
    'data.professionalTrait.value': professionalTraitValue,
    'data.professionalTrait.linkedId': professionalTraitId,
    'data.specialTrait.value': specialTraitValue,
    'data.specialTrait.linkedId': specialTraitId,
    'data.drawback.value': drawbackValue,
    'data.drawback.linkedId': drawbackId,
    'data.skillRanks': skillRanks,
    'data.talents': talents,
    'data.tier.-=completed': null,
    'data.tier.-=advancesPurchased': null,
    'data.tier.value': item?.flags?.zweihander?.professionTier ?? item.data.tier.value,
    'flags.zweihander.-=professionTier': null
  }
}

export const migrateWorldSafe = async function () {
  if (!game.user.isGM) return;
  const currentVersion = game.settings.get("zweihander", "systemMigrationVersion");
  const NEEDS_MIGRATION_VERSION = "0.3.30";
  const COMPATIBLE_MIGRATION_VERSION = "0.3.30";
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