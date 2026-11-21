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

test('legacy VDG configuration never prevents free previews from starting', () => {
  expect(readConfig({ VDG_SANDBOX_ENABLED: 'true' }).client.dataMode).toBe('mock');
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
  expect(config.client).toEqual({ dataMode: 'mock', reportAction: 'mock' });
  expect(readConfig({ NODE_ENV: 'production', VDG_API_KEY: 'secret' }).client).toEqual({
    dataMode: 'mock',
    reportAction: 'mock',
  });
});

test('launch data mode is explicit, validated and independent of runtime environment', () => {
  expect(readConfig({ CARSCOPE_DATA_MODE: 'connected' }).client).toEqual({
    dataMode: 'connected',
    reportAction: 'unavailable',
  });
  expect(
    readConfig({ NODE_ENV: 'production', CARSCOPE_DATA_MODE: 'connected' }).official.enabled,
  ).toBe(true);
  expect(() => readConfig({ CARSCOPE_DATA_MODE: 'bad' })).toThrow('CARSCOPE_DATA_MODE');
  expect(readConfig({ OFFICIAL_PREVIEW_ENABLED: 'true' }).client.dataMode).toBe('connected');
  expect(
    readConfig({ CARSCOPE_DATA_MODE: 'mock', OFFICIAL_PREVIEW_ENABLED: 'true' }).client.dataMode,
  ).toBe('mock');
});

test('sandbox generation is an explicit development-only opt-in with credentials', () => {
  const env = { CARSCOPE_DATA_MODE: 'connected', VDG_SANDBOX_ENABLED: 'true', VDG_API_KEY: 'key' };
  expect(readConfig(env).client.reportAction).toBe('sandbox');
  expect(readConfig({ ...env, NODE_ENV: 'production' }).client.reportAction).toBe('unavailable');
  expect(() => readConfig({ ...env, VDG_API_KEY: '' })).toThrow('VDG_API_KEY');
});
