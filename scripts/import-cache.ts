import { mkdir, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { validateDataset } from '../src/server/data';
import { importPrestigeCsv } from '../src/server/csv';
const source = process.argv[2];
if (!source) { console.error('Usage: bun run cache:import path/to/normalized-snapshot.json'); process.exit(1); }
try {
  const input = Bun.file(source);
  if (input.size > 20 * 1024 * 1024) throw new Error('Snapshot exceeds 20 MB.');
  const data = source.toLowerCase().endsWith('.csv') ? importPrestigeCsv(await input.text()) : validateDataset(await input.json());
  const destination = resolve(process.env.CAR_CACHE_PATH ?? '.cache/cars.json');
  await mkdir(dirname(destination), {recursive:true});
  const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
  await Bun.write(temporary, JSON.stringify(data,null,2)+'\n', { mode: 0o600 });
  await rename(temporary,destination);
  console.log(`Cached ${data.cars.length} listings as of ${data.asOf}. No external requests made.`);
} catch (error) { console.error(error instanceof Error ? error.message : 'Import failed'); process.exit(1); }
