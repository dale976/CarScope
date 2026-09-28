import { expect, test } from 'bun:test';
import { createReportApi } from '../src/server/api';
import { readConfig } from '../src/server/config';
import type { BuyingReport } from '../src/shared/report';
import type { ProviderVehicleDetails } from '../src/server/provider';

const report = {
  kind: 'sandbox-example',
  registration: 'LD17VAE',
  vehicle: { name: 'Tesla Model X 75D', year: 2017, mileage: null, askingPrice: null },
  detail: {
    registered: '2017-03-01',
    keepers: [],
    colour: 'Black',
    engine: 'Electric',
    transmission: 'Automatic',
  },
  motStatus: { status: 'valid', expiry: '2027-01-01', source: 'supplier' },
  tax: { status: 'taxed', dueDate: '2027-02-01', rates: [] },
  findings: [{ label: 'Paid finding', text: 'private', source: 'not-checked' }],
  checks: [{ name: 'Finance', status: 'none-returned' }],
  costs: [],
  sellerQuestions: [],
  evidence: {
    mot: [{ date: '2026-01-01', mileage: 50000, expiry: '2027-01-01', result: 'pass' }],
    tyres: [],
    notes: [],
  },
} as BuyingReport;
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://127.0.0.1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
test('API returns the fictional example and rejects other requests', async () => {
  const api = createReportApi();
  const response = api(new Request('http://localhost/api/sample-report'));
  expect((await response).status).toBe(200);
  expect((await response).headers.get('cache-control')).toBe('no-store');
  expect((await (await response).json()).kind).toBe('fictional-sample');
  expect(
    (await api(new Request('http://localhost/api/sample-report', { method: 'POST' }))).status,
  ).toBe(405);
  expect((await api(new Request('http://localhost/api/unknown'))).status).toBe(404);
});
test('runtime config endpoint exposes only client-safe controls', async () => {
  const api = createReportApi({ config: readConfig({ VDG_API_KEY: 'must-not-leak' }) });
  const response = await api(new Request('http://127.0.0.1/api/runtime-config'));
  const text = await response.text();
  expect(response.status).toBe(200);
  expect(JSON.parse(text)).toEqual({ sandboxControls: true });
  expect(text).not.toContain('must-not-leak');
});
test('spending endpoints require POST, JSON and same origin', async () => {
  const api = createReportApi({ config: readConfig({}) });
  expect((await api(new Request('http://127.0.0.1/api/report-preview'))).status).toBe(405);
  expect(
    (
      await api(
        post(
          '/api/report-preview',
          { mode: 'mock', registration: 'LD17VAE' },
          { Origin: 'https://example.com' },
        ),
      )
    ).status,
  ).toBe(403);
  expect(
    (await api(new Request('http://127.0.0.1/api/report-preview', { method: 'POST', body: '{}' })))
      .status,
  ).toBe(415);
});

test('API maps malformed requests to stable typed errors', async () => {
  const api = createReportApi({ config: readConfig({}) });
  const invalidJson = await api(
    new Request('http://127.0.0.1/api/report-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    }),
  );
  expect(invalidJson.status).toBe(400);
  expect(await invalidJson.json()).toEqual({ error: 'Invalid JSON body.', code: 'INVALID_JSON' });
  const invalidRegistration = await api(
    post('/api/report-preview', { mode: 'mock', registration: '../secret' }),
  );
  expect(invalidRegistration.status).toBe(422);
  expect((await invalidRegistration.json()).code).toBe('INVALID_REGISTRATION');
});

test('live sandbox restrictions return a correctable validation error', async () => {
  const api = createReportApi({
    config: readConfig({ VDG_SANDBOX_ENABLED: 'true', VDG_API_KEY: 'key' }),
  });
  const response = await api(
    post('/api/report-preview', { mode: 'live', registration: 'DF74FPX' }),
  );
  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({
    error: 'The development service can only search registrations containing the letter A.',
    code: 'SANDBOX_REGISTRATION_RESTRICTED',
  });
});

test('unexpected API failures return a generic response', async () => {
  const api = createReportApi({
    config: readConfig({}),
    loadMock: () => {
      throw new Error('private internal failure');
    },
  });
  const response = await api(
    post('/api/report-preview', { mode: 'mock', registration: 'LD17VAE' }),
  );
  expect(response.status).toBe(500);
  const text = await response.text();
  expect(text).toContain('INTERNAL_ERROR');
  expect(text).not.toContain('private internal failure');
});

test('mock preview stays local and exposes only the public projection', async () => {
  let liveCalls = 0;
  const api = createReportApi({
    loadMock: () => report,
    identifyLive: async () => {
      liveCalls++;
      throw new Error('must not run');
    },
  });
  const response = await api(
    post('/api/report-preview', { mode: 'mock', registration: 'LD17VAE' }),
  );
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(liveCalls).toBe(0);
  expect(body.vehicle.name).toBe('Tesla Model X 75D');
  for (const secret of ['Paid finding', 'Finance', 'evidence', 'Results', 'apiKey'])
    expect(JSON.stringify(body)).not.toContain(secret);
});

test('live preview invokes identification once and generation invokes completion once', async () => {
  let identifyCalls = 0,
    completeCalls = 0;
  const api = createReportApi({
    config: readConfig({ VDG_SANDBOX_ENABLED: 'true', VDG_API_KEY: 'key' }),
    identifyLive: async (registration) => {
      identifyCalls++;
      return {
        preview: {
          registration,
          source: 'live',
          vehicle: { name: 'Tesla Model X 75D', year: 2017 },
          coverage: { message: 'Detailed history is checked in the complete report' },
        },
        details: { VehicleDetails: { private: true } } as ProviderVehicleDetails,
        previewData: { VehicleTaxDetails: { private: true } } as ProviderVehicleDetails,
      };
    },
    completeLive: async () => {
      completeCalls++;
      return report;
    },
  });
  const previewResponse = await api(
    post('/api/report-preview', { mode: 'live', registration: 'LD17VAE' }),
  );
  const preview = await previewResponse.json();
  expect(identifyCalls).toBe(1);
  expect(JSON.stringify(preview)).not.toContain('private');
  const result = await api(
    post('/api/report-generate', {
      mode: 'live',
      registration: 'LD17VAE',
      previewId: preview.previewId,
    }),
  );
  expect(result.status).toBe(200);
  expect(completeCalls).toBe(1);
});

test('invalid or mismatched preview IDs spend no completion calls', async () => {
  let completeCalls = 0;
  const api = createReportApi({
    loadMock: () => report,
    completeLive: async () => {
      completeCalls++;
      return report;
    },
  });
  const invalid = await api(
    post('/api/report-generate', { mode: 'live', registration: 'LD17VAE', previewId: 'missing' }),
  );
  expect(invalid.status).toBe(410);
  expect(completeCalls).toBe(0);
  const preview = await (
    await api(post('/api/report-preview', { mode: 'mock', registration: 'LD17VAE' }))
  ).json();
  const mismatch = await api(
    post('/api/report-generate', {
      mode: 'mock',
      registration: 'SL60AUC',
      previewId: preview.previewId,
    }),
  );
  expect(mismatch.status).toBe(409);
  expect(completeCalls).toBe(0);
});

test('two rapid generation requests share one completion promise', async () => {
  let loads = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const api = createReportApi({
    loadMock: () => report,
    completeMock: async (value) => {
      loads++;
      await gate;
      return value;
    },
  });
  const preview = await (
    await api(post('/api/report-preview', { mode: 'mock', registration: 'LD17VAE' }))
  ).json();
  const first = api(
    post('/api/report-generate', {
      mode: 'mock',
      registration: 'LD17VAE',
      previewId: preview.previewId,
    }),
  );
  const second = api(
    post('/api/report-generate', {
      mode: 'mock',
      registration: 'LD17VAE',
      previewId: preview.previewId,
    }),
  );
  await Promise.resolve();
  release();
  expect((await first).status).toBe(200);
  expect((await second).status).toBe(200);
  expect(loads).toBe(1);
});
