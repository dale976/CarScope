import { describe, expect, test } from 'bun:test';

const root = new URL('../', import.meta.url);
const activeFiles = [
  'package.json',
  '.env.example',
  'README.md',
  'docs/architecture.md',
  'docs/launch-readiness-plan.md',
];

const obsoletePatterns = [
  /apps\/search/i,
  /MarketCheck/i,
  /MARKETCHECK_/,
  /CAR_CACHE/,
  /\.budget/,
  /dev:report|start:report|smoke:report/,
  /enthusiast search/i,
];

describe('repository boundaries', () => {
  test('active configuration and documentation describe one buying-report application', async () => {
    for (const path of activeFiles) {
      const contents = await Bun.file(new URL(path, root)).text();
      for (const pattern of obsoletePatterns) {
        expect(contents, `${path} still contains ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  test('the root manifest exposes the production application commands', async () => {
    const manifest = await Bun.file(new URL('package.json', root)).json();
    expect(manifest.workspaces).toBeUndefined();
    expect(Object.keys(manifest.scripts)).toEqual(
      expect.arrayContaining(['dev', 'build', 'start', 'test', 'check', 'smoke']),
    );
  });
});
