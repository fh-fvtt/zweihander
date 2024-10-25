import { extractPack } from '@foundryvtt/foundryvtt-cli';
import { promises as fs } from 'fs';
import path from 'path';

const SYSTEM_ID = process.cwd();

const packs = await fs.readdir('./packs');

for (const pack of packs) {
  if (pack === '.gitkeep' || pack.includes('.db')) continue;

  console.log('Unpacking ' + pack);

  const directory = `./packs-src/data-ldb/${pack}`;

  try {
    for (const file of await fs.readdir(directory)) {
      await fs.unlink(path.join(directory, file));
    }
  } catch (error) {
    if (error.code === 'ENOENT') console.log('No files inside of ' + pack);
    else console.log(error);
  }

  await extractPack(`${SYSTEM_ID}/packs/${pack}`, `${SYSTEM_ID}/packs-src/data-ldb/${pack}`, {
    yaml: false,
    transformName: transformName,
  });
}

/**
 * Prefaces the document with its type
 * @param {object} doc - The document data
 */
function transformName(doc) {
  const safeFileName = doc.name.replace(/[^a-zA-Z0-9А-я]/g, '_');
  const type = doc._key.split('!')[1];
  const prefix = ['actors', 'items'].includes(type) ? doc.type : type;

  return `${doc.name ? `${prefix}_${safeFileName}_${doc._id}` : doc._id}.json`;
}
