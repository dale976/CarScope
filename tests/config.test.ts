import { expect, test } from 'bun:test';
import { isAllowedOrigin, readConfig } from '../src/server/config';

test('PORT is canonical with REPORT_PORT as a backwards-compatible fallback', () => {
  expect(readConfig({ PORT: '4321', REPORT_PORT: '4322' }).port).toBe(4321);
  expect(readConfig({ REPORT_PORT: '4322' }).port).toBe(4322);
  expect(readConfig({}).port).toBe(9000);
  for (const value of ['abc', '0', '65536', '3.5']) {
    expect(() => readConfig({ PORT: value })).toThrow('PORT');
  }
});

test('unsupported explicit environments fail closed', () => {
  expect(() => readConfig({ NODE_ENV: 'prod', HOST: '0.0.0.0' })).toThrow('NODE_ENV');
  expect(readConfig({}).environment).toBe('development');
});

test('sandbox configuration requires a server-side key', () => {
  expect(() => readConfig({ VDG_SANDBOX_ENABLED: 'true' })).toThrow('VDG_API_KEY');
  expect(readConfig({ VDG_SANDBOX_ENABLED: 'true', VDG_API_KEY: 'secret' }).sandbox).toEqual({
    enabled: true,
    apiKey: 'secret',
  });
});

test('production non-loopback binding requires a clean public origin', () => {
  expect(() => readConfig({ NODE_ENV: 'production', HOST: '0.0.0.0' })).toThrow('PUBLIC_ORIGIN');
  for (const origin of [
    'https://user:pass@example.com',
    'https://example.com/path',
    'https://example.com?query=1',
    'ftp://example.com',
  ]) {
    expect(() =>
      readConfig({ NODE_ENV: 'production', HOST: '0.0.0.0', PUBLIC_ORIGIN: origin }),
    ).toThrow('PUBLIC_ORIGIN');
  }
  expect(
    readConfig({
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PUBLIC_ORIGIN: 'https://carscope.example',
    }).publicOrigin,
  ).toBe('https://carscope.example');
});

test('production origin comparison is exact and development stays same-origin', () => {
  const production = readConfig({
    NODE_ENV: 'production',
    HOST: '0.0.0.0',
    PUBLIC_ORIGIN: 'https://carscope.example',
  });
  expect(
    isAllowedOrigin(
      new Request('http://internal/api/report-preview', {
        headers: { Origin: 'https://carscope.example' },
      }),
      production,
    ),
  ).toBe(true);
  expect(
    isAllowedOrigin(
      new Request('http://internal/api/report-preview', {
        headers: { Origin: 'https://carscope.example.evil.test' },
      }),
      production,
    ),
  ).toBe(false);
  const development = readConfig({});
  expect(
    isAllowedOrigin(
      new Request('http://127.0.0.1/api/report-preview', {
        headers: { Origin: 'http://127.0.0.1' },
      }),
      development,
    ),
  ).toBe(true);
});

test('configuration resolves the private mock root and exposes safe runtime settings', () => {
  const config = readConfig({ CARSCOPE_ROOT: '/tmp/carscope-test' });
  expect(config.root).toBe('/tmp/carscope-test');
  expect(config.client).toEqual({ sandboxControls: true });
  expect(readConfig({ NODE_ENV: 'production', VDG_API_KEY: 'secret' }).client).toEqual({
    sandboxControls: false,
  });
});
