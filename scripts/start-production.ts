import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

export function productionEnvironment(
  env: Record<string, string | undefined>,
): Record<string, string | undefined> {
  return { ...env, CARSCOPE_ROOT: ROOT, NODE_ENV: 'production' };
}

const process = Bun.spawn([Bun.which('bun') ?? 'bun', 'index.js'], {
  cwd: resolve(ROOT, 'dist'),
  env: productionEnvironment(Bun.env),
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
});

const stop = () => process.kill();
globalThis.process.on('SIGINT', stop);
globalThis.process.on('SIGTERM', stop);
try {
  const code = await process.exited;
  if (code !== 0) throw new Error(`Application exited with status ${code}`);
} finally {
  globalThis.process.off('SIGINT', stop);
  globalThis.process.off('SIGTERM', stop);
}
