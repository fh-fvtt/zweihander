import Datastore from 'nedb-promises';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const dataPath = path.resolve(process.cwd(), 'packs/data');
const packsPath = path.resolve(process.cwd(), 'packs');

for await (const pack of await fs.readdir(dataPath)) {
  await fs.rm(path.resolve(packsPath, pack), { force: true });
  const db = Datastore.create(path.resolve(packsPath, pack));
  for await (const document of await fs.readdir(path.resolve(dataPath, pack))) {
    const json = JSON.parse(await fs.readFile(path.resolve(dataPath, pack, document), 'utf8'));
    await db.insert(json);
  }
  console.log('Finished building pack', pack);
}
