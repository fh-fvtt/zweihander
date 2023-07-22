// extract packs script, copied heavily from the pf2e system, much thanks to stwlam#3718

import Datastore from 'nedb-promises';
import yargs from 'yargs';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Show error message without needless stack trace
const PackError = (message) => {
  console.error(`Error: ${message}`);
  process.exit(1);
};

const args = yargs(process.argv.slice(2))
  .command(
    '$0 <packDb> [disablePresort] [logWarnings]',
    'Extract one or all compendium packs to packs/data',
    (yargs) => {
      yargs.positional('packDb', {
        describe: 'A compendium pack filename (*.db) or otherwise "all"',
        coerce: (arg) => {
          const packDb = arg.toLowerCase();
          return packDb === 'all' ? packDb : packDb.replace(/[^a-z0-9]+$/, '').replace(/(?:\.db)?$/, '.db');
        },
      });
      // .option('disablePresort', {
      //   describe: 'Turns off data item presorting.',
      //   type: 'boolean',
      //   default: false,
      // })
      // .option('logWarnings', {
      //   describe: 'Turns on logging out warnings about extracted data.',
      //   type: 'boolean',
      //   default: true,
      // })
      // .example([['npm run $0 skills.db'], ['npm run $0 all --disablePresort']]);
    }
  )
  .help(false)
  .version(false)
  .parseSync();

const packsPath = path.join(process.cwd(), 'packs');
const dataPath = path.resolve(process.cwd(), 'packs-src/data');
const tempDataPath = path.resolve(process.cwd(), 'packs-src/temp-data');

function assertDocIdSame(newSource, jsonPath) {
  if (fsSync.existsSync(jsonPath)) {
    const oldSource = JSON.parse(fsSync.readFileSync(jsonPath, { encoding: 'utf-8' }));
    if (oldSource._id !== newSource._id) {
      throw PackError(
        `The ID of doc "${newSource.name}" (${newSource._id}) does not match the current ID ` +
          `(${oldSource._id}). Documents that are already in the system must keep their current ID.`
      );
    }
  }
}

const wordCharacter = String.raw`[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]`;
const nonWordCharacter = String.raw`[^\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]`;
const nonWordCharacterRE = new RegExp(nonWordCharacter, 'gu');
const nonWordBoundary = String.raw`(?:${wordCharacter})(?=${wordCharacter})`;
const lowerCaseLetter = String.raw`\p{Lowercase_Letter}`;
const upperCaseLetter = String.raw`\p{Uppercase_Letter}`;
const lowerCaseThenUpperCaseRE = new RegExp(`(${lowerCaseLetter})(${upperCaseLetter}${nonWordBoundary})`, 'gu');

function sluggify(text) {
  return text
    .replace(lowerCaseThenUpperCaseRE, '$1-$2')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(nonWordCharacterRE, ' ')
    .trim()
    .replace(/[-\s]+/g, '-');
}

async function extractPack(filePath, packFilename) {
  console.log(`Extracting pack: ${packFilename} (Presorting: ${args.disablePresort ? 'Disabled' : 'Enabled'})`);
  const outPath = path.resolve(tempDataPath, packFilename);
  const db = Datastore.create({
    filename: filePath,
    autoload: true,
  });
  const packSources = await db.find({});
  for (const source of packSources) {
    const preparedSource = source;
    delete preparedSource._stats;
    delete preparedSource.flags;
    delete preparedSource.folder;
    delete preparedSource.ownership;
    delete preparedSource.permission;
    delete preparedSource.sort;
    const allKeys = new Set();
    JSON.stringify(preparedSource, (key, value) => {
      allKeys.add(key);
      return value;
    });
    const sortedKeys = Array.from(allKeys).sort();
    const outData = `${JSON.stringify(preparedSource, sortedKeys, 2)}\n`;

    const outFileName = `${sluggify(source.name)}.json`;
    const outFilePath = path.resolve(outPath, outFileName);
    if (fsSync.existsSync(outFilePath)) {
      throw PackError(`Error: Duplicate name "${source.name}" in pack: ${packFilename}`);
    }
    assertDocIdSame(preparedSource, outFilePath);
    await fs.writeFile(path.resolve(outPath, outFileName), outData, 'utf-8');
  }

  return packSources.length;
}

async function extractPacks() {
  if (!fsSync.existsSync(dataPath)) {
    await fs.mkdir(dataPath);
  }
  if (!fsSync.existsSync(packsPath)) {
    throw Error('Foundry directory not found! Check your foundryconfig.json.');
  }

  console.log('Cleaning up old temp data...');
  await fs.rm(tempDataPath, { recursive: true, force: true });
  await fs.mkdir(tempDataPath);

  const foundryPacks = (args.packDb === 'all' ? await fs.readdir(packsPath) : [args.packDb])
    .filter((f) => f.endsWith('.db'))
    .map((f) => path.resolve(packsPath, f));

  return (
    await Promise.all(
      foundryPacks.map(async (filePath) => {
        const dbFilename = path.basename(filePath);
        if (['temp-data', 'data', 'scripts'].includes(dbFilename)) {
          return 0;
        }
        if (!dbFilename.endsWith('.db')) {
          throw PackError(`Pack file is not a DB file: "${dbFilename}"`);
        }
        if (!fsSync.existsSync(filePath)) {
          throw PackError(`File not found: "${dbFilename}"`);
        }

        const outDirPath = path.resolve(dataPath, dbFilename);
        const tempOutDirPath = path.resolve(tempDataPath, dbFilename);

        await fs.mkdir(tempOutDirPath);

        const sourceCount = await extractPack(filePath, dbFilename);

        // Move ./packs/temp-data/[packname].db/ to ./packs/data/[packname].db/
        await fs.rm(outDirPath, { recursive: true, force: true });
        await fs.rename(tempOutDirPath, outDirPath);

        console.log(`Finished extracting ${sourceCount} documents from pack ${dbFilename}`);
        return sourceCount;
      })
    )
  ).reduce((runningTotal, count) => runningTotal + count, 0);
}

try {
  const grandTotal = await extractPacks();
  await fs.rm(tempDataPath, { recursive: true, force: true });
  console.log(`Extraction complete (${grandTotal} total documents).`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
