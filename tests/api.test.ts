import { expect, test } from 'bun:test';
import { createReportApi } from '../src/server/api';
import { readConfig } from '../src/server/config';
import { createDvlaClient } from '../src/server/dvla/client';
import { createDvsaClient } from '../src/server/dvsa/client';
import { createOfficialPreview } from '../src/server/official-preview';
import type { VehiclePreview } from '../src/shared/preview';
import type { BuyingReport } from '../src/shared/report';

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
  expect(JSON.parse(text)).toEqual({ sandboxControls: true, officialPreview: false });
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

test('legacy VDG preview and generation modes are rejected even with a VDG key', async () => {
  const api = createReportApi({
    config: readConfig({ VDG_SANDBOX_ENABLED: 'true', VDG_API_KEY: 'key' }),
  });
  for (const path of ['/api/report-preview', '/api/report-generate']) {
    const response = await api(
      post(path, { mode: 'live', registration: 'YJ22ACU', previewId: 'old' }),
    );
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe('INVALID_MODE');
  }
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
    identifyOfficial: async () => {
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

test('official preview is separate from paid completion and never creates a paid session', async () => {
  let calls = 0;
  const api = createReportApi({
    config: readConfig({ OFFICIAL_PREVIEW_ENABLED: 'true', DVLA_API_KEY: 'key' }),
    identifyOfficial: async (registration) => {
      calls++;
      return {
        registration,
        previewId: '',
        source: 'official',
        vehicle: { name: 'LOTUS EXIGE', year: 2022 },
        coverage: { message: '2 MOT tests returned' },
      } as VehiclePreview;
    },
  });
  const response = await api(
    post('/api/report-preview', { mode: 'official', registration: 'yj22 acu' }),
  );
  expect(response.status).toBe(200);
  expect((await response.json()).vehicle.name).toBe('LOTUS EXIGE');
  expect(calls).toBe(1);
  const completion = await api(
    post('/api/report-generate', { mode: 'official', registration: 'YJ22ACU' }),
  );
  expect(completion.status).toBe(409);
  expect((await completion.json()).code).toBe('PAID_REPORT_UNAVAILABLE');
  expect(calls).toBe(1);
});

test('official preview disabled or production request cannot invoke sources', async () => {
  for (const env of [
    {},
    { NODE_ENV: 'production', OFFICIAL_PREVIEW_ENABLED: 'true', DVLA_API_KEY: 'key' },
  ]) {
    let calls = 0;
    const api = createReportApi({
      config: readConfig(env),
      identifyOfficial: async () => {
        calls++;
        throw new Error('should not run');
      },
    });
    expect(
      (await api(post('/api/report-preview', { mode: 'official', registration: 'YJ22ACU' })))
        .status,
    ).toBe(503);
    expect(calls).toBe(0);
  }
});

test('invalid or mismatched mock preview IDs cannot generate reports', async () => {
  const api = createReportApi({ loadMock: () => report });
  expect(
    (
      await api(
        post('/api/report-generate', {
          mode: 'mock',
          registration: 'LD17VAE',
          previewId: 'missing',
        }),
      )
    ).status,
  ).toBe(410);
  const preview = await (
    await api(post('/api/report-preview', { mode: 'mock', registration: 'LD17VAE' }))
  ).json();
  expect(
    (
      await api(
        post('/api/report-generate', {
          mode: 'mock',
          registration: 'SL60AUC',
          previewId: preview.previewId,
        }),
      )
    ).status,
  ).toBe(409);
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

test('combined API journey uses real DVLA/DVSA clients with only official HTTP destinations', async () => {
  const destinations: string[] = [];
  const fetcher = async (url: string | URL, init?: RequestInit) => {
    destinations.push(String(url));
    const host = new URL(url).hostname;
    if (host === 'login.microsoftonline.com')
      return Response.json({ access_token: 'token', expires_in: 3600 });
    if (host === 'uat.driver-vehicle-licensing.api.gov.uk') {
      expect(init?.method).toBe('POST');
      return Response.json({
        registrationNumber: 'YJ22ACU',
        make: 'LOTUS',
        taxStatus: 'Taxed',
        monthOfFirstRegistration: '2022-05',
      });
    }
    if (host === 'history.mot.api.gov.uk')
      return Response.json({
        registration: 'YJ22ACU',
        make: 'LOTUS',
        model: 'EXIGE',
        motTests: [
          {
            completedDate: '2026-04-24T12:00:00',
            testResult: 'PASSED',
            expiryDate: '2027-05-10',
            odometerValue: '8541',
            odometerUnit: 'mi',
            odometerResultType: 'READ',
            defects: [{ type: 'ADVISORY', text: 'Tyre worn' }],
          },
        ],
      });
    throw new Error('Unexpected supplier destination');
  };
  const dvla = createDvlaClient({ environment: 'development', apiKey: 'dvla-secret' }, { fetcher });
  const dvsa = createDvsaClient(
    {
      clientId: 'client',
      clientSecret: 'dvsa-secret',
      apiKey: 'dvsa-key',
      scope: 'https://tapi.dvsa.gov.uk/.default',
      tokenUrl:
        'https://login.microsoftonline.com/12345678-1234-1234-1234-123456789abc/oauth2/v2.0/token',
    },
    { fetcher },
  );
  const api = createReportApi({
    config: readConfig({ OFFICIAL_PREVIEW_ENABLED: 'true' }),
    identifyOfficial: createOfficialPreview({
      dvla: dvla.lookup,
      dvsa: dvsa.lookup,
      testData: true,
    }),
  });
  const response = await api(
    post('/api/report-preview', { mode: 'official', registration: 'YJ22 ACU' }),
  );
  const value = await response.json();
  expect(response.status).toBe(200);
  expect(value.vehicle.name).toBe('LOTUS EXIGE');
  expect(value.tax.status).toBe('taxed');
  expect(value.motHistory[0].defects[0].text).toBe('Tyre worn');
  expect(value.recordedMileage.value).toBe(8541);
  expect(value.official.testData).toBe(true);
  expect(destinations).toHaveLength(3);
  expect(JSON.stringify(value)).not.toContain('secret');
  const paid = await api(
    post('/api/report-generate', {
      mode: 'official',
      registration: 'YJ22ACU',
      previewId: value.previewId,
    }),
  );
  expect(paid.status).toBe(409);
  expect(destinations).toHaveLength(3);
});
