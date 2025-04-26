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
        /* case 'Actor':
          updateData = await migrateActorData(doc.toObject());
          break; */
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
    if (itemData.system.ancestralModifiers.value) {
      const updatedModifiers = [...itemData.system.ancestralModifiers.value];

      if (!updatedModifiers.length) {
        const positiveModifiers = itemData.system.ancestralModifiers.positive;
        const negativeModifiers = itemData.system.ancestralModifiers.negative;

        let countMap = {};

        for (let i = 0; i < positiveModifiers.length; i++) {
          if (!countMap[positiveModifiers[i]]) countMap[positiveModifiers[i]] = 1;
          else countMap[positiveModifiers[i]] += 1;
        }

        for (let i = 0; i < negativeModifiers.length; i++) {
          if (!countMap[negativeModifiers[i]]) countMap[negativeModifiers[i]] = -1;
          else countMap[negativeModifiers[i]] -= 1;
        }

        const toAdd = [];

        for (const [k, v] of Object.entries(countMap)) {
          toAdd.push({ key: k, value: v });
        }

        update['system.ancestralModifiers.value'] = toAdd;
      }
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
    migrateField('duration', 'duration', 0, () => ({
      value: 0,
      formula: { number: 1, die: 'd10', bonus: 1 },
      lastsUntilCured: false,
    }));
  } else if (item.type === 'armor') {
    if (!(itemData.system.qualities instanceof Array)) {
      const qualities = itemData.system.qualities.value;
      const arrayOfQualities = qualities ? qualities.split(',').map((q) => q.trim()) : [];

      for (let i = 0; i < arrayOfQualities.length; i++) {
        arrayOfQualities[i] = (await globalThis.findItemWorldWide('quality', arrayOfQualities[i])).uuid;
      }

      migrateField('qualities', 'qualities', 0, () => arrayOfQualities);
    }
  } else if (item.type === 'ritual') {
    migrateField('castingTime', 'castingTime', 0, () => ({
      setting: 'varies',
      value: 'varies',
      number: 0,
      unit: 'minutes',
    }));

    migrateField('difficulty', 'difficulty', 0, () => ({
      rating: 0,
      associatedSkill: 'Incantation',
    }));
  } else if (item.type === 'spell') {
    if (typeof itemData.system.duration !== 'object') {
      // [WB]+3 minutes

      const durationSteps = itemData.system.duration.split(' ');
      const unit = durationSteps[durationSteps.length - 1];

      const durationValue = itemData.system.duration;
      const durationBonuses = durationValue.match(/\d+/g);

      let durationBonus = 0;

      const isDurationDerived = durationBonuses !== null;

      if (isDurationDerived) durationBonus = durationBonuses.map((s) => parseInt(s)).reduce((acc, val) => acc + val, 0);

      migrateField('duration', 'duration', 0, () => ({
        value: isDurationDerived ? 'instantaneous' : durationValue.toLowerCase(),
        label: durationValue ?? '',
        formula: {
          override: isDurationDerived,
        },
        base: '[WB]',
        bonus: durationBonus,
        unit: unit,
      }));
    }
  } else if (item.type === 'weapon') {
    if (!(itemData.system.qualities instanceof Array)) {
      const qualities = itemData.system.qualities.value;
      const arrayOfQualities = qualities ? qualities.split(',').map((q) => q.trim()) : [];

      for (let i = 0; i < arrayOfQualities.length; i++) {
        arrayOfQualities[i] = (await globalThis.findItemWorldWide('quality', arrayOfQualities[i])).uuid;
      }

      migrateField('qualities', 'qualities', 0, () => arrayOfQualities);
    }

    const overrideFormula = itemData.system.damage.formula ?? '';

    if (typeof overrideFormula !== 'object') {
      migrateField('damage.formula', 'damage.formula', 0, () => ({
        override: false,
        value: overrideFormula ?? '',
      }));

      for (let pab of CONFIG.ZWEI.primaryAttributeBonuses) {
        const fullPab = '[' + pab + ']';
        if (overrideFormula.startsWith(fullPab)) {
          update['system.damage.attributeBonus'] = fullPab;
          break;
        }
      }
    }

    if (typeof itemData.system.distance !== 'object') {
      const distanceValue = itemData.system.distance.replaceAll(/(yards)|(yard)|(yds\.?)|(yd\.?)/g, '');
      const distanceBonuses = distanceValue.match(/\d+/g);

      let distanceBonus = 0;

      if (distanceBonuses !== null)
        distanceBonus = distanceBonuses.map((s) => parseInt(s)).reduce((acc, val) => acc + val, 0);

      migrateField('distance', 'distance', 0, () => ({
        value: distanceValue ?? '',
        base: '[PB]',
        bonus: distanceBonus,
      }));
    }

    const load = itemData.system.load;

    migrateField('load', 'ranged.load', 0);

    if (load != 0) update['system.ranged.value'] = true;

    update['system.damage.fury'] = {
      value: true,
      explodesOn: itemData.system.weaponType.includes('Gunpowder') ? ['1', '6'] : ['6'],
    };
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
  const NEEDS_MIGRATION_VERSION = '5.5.0'; // @todo: change for release
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
