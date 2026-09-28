import { expect, test } from 'bun:test';
import { createReportApi } from '../src/server/api';
import { readConfig } from '../src/server/config';
import { securityHeaders, withResponseHeaders } from '../src/server/http';
import { createLogger } from '../src/server/logger';

test('report responses receive common privacy and browser protections', () => {
  const config = readConfig({});
  const headers = securityHeaders(config);
  expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  expect(headers['Content-Security-Policy']).toContain('https://vehicleimages.ukvehicledata.co.uk');
  const response = withResponseHeaders(new Response('ok'), config, true);
  expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  expect(response.headers.get('permissions-policy')).toContain('camera=()');
  expect(response.headers.get('cache-control')).toBe('no-store');
});

test('health is local and never invokes a provider', async () => {
  let providerCalls = 0;
  const api = createReportApi({
    config: readConfig({}),
    identifyLive: async () => {
      providerCalls++;
      throw new Error('must not run');
    },
  });
  const response = await api(new Request('http://127.0.0.1/api/health'));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok', persistence: 'memory' });
  expect(providerCalls).toBe(0);
});

test('production logging is structured and accepts only safe operational fields', () => {
  const lines: string[] = [];
  const logger = createLogger(readConfig({ NODE_ENV: 'production' }), (line) => lines.push(line));
  logger.info({
    event: 'request.complete',
    requestId: 'request-1',
    route: '/api/report-preview',
    status: 200,
    durationMs: 12,
  });
  expect(JSON.parse(lines[0] ?? '{}')).toEqual({
    event: 'request.complete',
    requestId: 'request-1',
    route: '/api/report-preview',
    status: 200,
    durationMs: 12,
  });
  expect(lines.join('')).not.toContain('registration');
  expect(lines.join('')).not.toContain('apiKey');
});
