import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// Bun loads the project-root .env before this launcher runs. Preserve the cache
// location while resolving the fullstack asset manifest from the build folder.
process.env.CAR_CACHE_PATH = resolve(process.env.CAR_CACHE_PATH ?? '.cache/cars.json');
process.env.CARSCOPE_BUDGET_PATH = resolve('.budget/marketcheck.sqlite');
process.env.NODE_ENV = 'production';
const buildDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
process.chdir(buildDirectory);
await import(pathToFileURL(resolve(buildDirectory, 'index.js')).href);
