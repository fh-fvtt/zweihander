import Datastore from 'nedb-promises';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import getStableIdGenerator from './stable-id-generator.mjs';

const dataPath = path.resolve(process.cwd(), 'packs/data');
const packsPath = path.resolve(process.cwd(), 'packs');

const stableIds = getStableIdGenerator();

const lookup = new Map();
const writeJobs = [];

for await (const pack of await fs.readdir(dataPath)) {
  await fs.rm(path.resolve(packsPath, pack), { force: true });
  const db = Datastore.create(path.resolve(packsPath, pack));
  const packLookup = new Map();
  lookup.set(pack.substring(0, pack.length - 3), packLookup);
  for await (const document of await fs.readdir(path.resolve(dataPath, pack))) {
    const json = JSON.parse(await fs.readFile(path.resolve(dataPath, pack, document), 'utf8'));
    if (json._id === undefined) {
      json._id = stableIds.next().value;
    }
    packLookup.set(json._id, json);
    const job = async () => {
      if (['creature', 'npc', 'character'].includes(json.type)) {
        json.items = json.items.map((item) => {
          if (item.__injectId) {
            const [pack, id] = item.__injectId.split('.');
            const itemToInject = lookup.get(pack).get(id);
            if (item.__rename) {
              itemToInject.name = item.name;
            }
            return itemToInject;
          }
          return item;
        });
      }
      await db.insert(json);
    };
    writeJobs.push(job);
  }
  writeJobs.push(() => console.log('Finished building pack', pack));
}

await Promise.all(writeJobs.map((job) => job()));
