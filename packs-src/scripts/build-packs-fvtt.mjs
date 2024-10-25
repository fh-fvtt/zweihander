import process from 'node:process';
import { compilePack } from '@foundryvtt/foundryvtt-cli';
import { promises as fs } from 'fs';

const SYSTEM_ID = process.cwd();

console.log(SYSTEM_ID);

const packs = await fs.readdir('./packs-src/data-ldb/');

for (const pack of packs) {
  if (pack === '.gitkeep') continue;

  console.log('Packing ' + pack);

  await compilePack(`${SYSTEM_ID}/packs-src/data-ldb/${pack}`, `${SYSTEM_ID}/packs/${pack}`, { yaml: false });
}
