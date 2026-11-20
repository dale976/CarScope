import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleReport } from '../fixtures/sample-report';

const port = 49000 + Math.floor(Math.random() * 10000);
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const base = new URL(`http://127.0.0.1:${port}`);
const fixtureRoot = mkdtempSync(join(tmpdir(), 'carscope-smoke-'));
mkdirSync(join(fixtureRoot, '.local'));
writeFileSync(
  join(fixtureRoot, '.local/tesla-report.json'),
  JSON.stringify({
    ...sampleReport,
    kind: 'sandbox-example',
    registration: 'LD17VAE',
    vehicle: { ...sampleReport.vehicle, name: 'Tesla Model X 75D', year: 2017, askingPrice: null },
  }),
);
const child = Bun.spawn([process.execPath, 'index.js'], {
  cwd: resolve(ROOT, 'dist'),
  env: {
    ...process.env,
    CARSCOPE_ROOT: fixtureRoot,
    HOST: '127.0.0.1',
    PORT: String(port),
    REPORT_PORT: String(port),
    NODE_ENV: 'production',
    OFFICIAL_PREVIEW_ENABLED: 'false',
    VDG_SANDBOX_ENABLED: 'false',
  },
  stdout: 'ignore',
  stderr: 'pipe',
});
async function check(path: string) {
  const r = await fetch(new URL(path, base));
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r;
}
async function post(path: string, body: unknown) {
  const r = await fetch(new URL(path, base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
}
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      await check('/');
      ready = true;
      break;
    } catch {
      await Bun.sleep(50);
    }
  }
  if (!ready) throw new Error('Report production server did not start.');
  const documentResponse = await check('/report');
  for (const header of [
    'content-security-policy',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
  ]) {
    if (!documentResponse.headers.has(header)) throw new Error(`Document missing ${header}`);
  }
  const html = await documentResponse.text();
  const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1]!);
  if (assets.length < 2) throw new Error('Built assets missing');
  for (const asset of assets) {
    if (new URL(asset, base).origin !== base.origin) throw new Error('External asset');
    await check(asset);
  }
  const preview = await post('/api/report-preview', { mode: 'mock', registration: 'LD17VAE' });
  const publicPreview = JSON.stringify(preview);
  if (
    !preview.previewId ||
    publicPreview.includes('findings') ||
    publicPreview.includes('checks') ||
    publicPreview.includes('evidence')
  )
    throw new Error('Preview exposed complete-report fields');
  const report = await post('/api/report-generate', {
    mode: 'mock',
    registration: 'LD17VAE',
    previewId: preview.previewId,
  });
  if (report.kind !== 'sandbox-example' || report.registration !== 'LD17VAE')
    throw new Error('Unexpected generated mock report');
  for (const [path, mode, expectedStatus] of [
    ['/api/report-preview', 'official', 503],
    ['/api/report-preview', 'live', 422],
    ['/api/report-generate', 'official', 409],
    ['/api/report-generate', 'live', 422],
  ] as const) {
    const response = await fetch(new URL(path, base), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, registration: 'LD17VAE' }),
    });
    if (response.status !== expectedStatus)
      throw new Error(`Unexpected production boundary for ${path}/${mode}: ${response.status}`);
  }
  if ((await fetch(new URL('/missing', base))).status !== 404)
    throw new Error('Missing route should be 404');
  console.log(
    'Report smoke passed: built route/assets and staged Mock journey, with no external calls.',
  );
} finally {
  child.kill();
  await child.exited;
  rmSync(fixtureRoot, { recursive: true, force: true });
}
