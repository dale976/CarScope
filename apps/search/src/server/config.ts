import {rootPath} from './paths';
export interface Config { mode: 'mock' | 'cache'; cachePath: string; host: string; port: number }
// Keys remain in Bun.env on the server. Never expose the environment to client bundles.
export function readConfig(env: Record<string, string | undefined> = Bun.env): Config {
  const mode = env.DATA_MODE ?? 'mock';
  if (mode !== 'mock' && mode !== 'cache') throw new Error('Live API access is disabled. DATA_MODE must be mock or cache.');
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  return { mode, port, host: env.HOST ?? '127.0.0.1', cachePath: rootPath(env.CAR_CACHE_PATH ?? '.cache/cars.json') };
}
