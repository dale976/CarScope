import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rmSync } from 'node:fs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

export async function buildApplication(root = ROOT): Promise<void> {
  rmSync(resolve(root, 'dist'), { recursive: true, force: true });
  const process = Bun.spawn(
    [
      Bun.which('bun') ?? 'bun',
      'build',
      'src/server/index.ts',
      '--target=bun',
      '--outdir=dist',
      '--production',
      '--minify',
    ],
    { cwd: root, stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' },
  );
  const code = await process.exited;
  if (code !== 0) throw new Error(`Build exited with status ${code}`);
}

if (import.meta.main) await buildApplication();
