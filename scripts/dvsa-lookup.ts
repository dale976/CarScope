import { createDvsaClient, readDvsaConfig } from '../src/server/dvsa/client';

const args = process.argv.slice(2).filter((arg) => arg !== '--');
if (args.length !== 1 || !/^[A-Z0-9]{2,8}$/i.test(args[0]!.replace(/\s/g, ''))) {
  console.error('Usage: bun run dvsa:lookup -- YJ22ACU');
  process.exitCode = 1;
} else {
  try {
    const result = await createDvsaClient(readDvsaConfig()).lookup(args[0]!);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'DVSA lookup failed.');
    process.exitCode = 1;
  }
}
