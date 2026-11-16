import { expect, test } from 'bun:test';
import { createDvsaClient, readDvsaConfig, type DvsaConfig } from '../src/server/dvsa/client';
import { normalizeDvsaVehicle } from '../src/server/dvsa/normalize';

const config: DvsaConfig = {
  clientId: 'test-client',
  clientSecret: 'private-secret',
  apiKey: 'private-key',
  scope: 'https://tapi.dvsa.gov.uk/.default',
  tokenUrl:
    'https://login.microsoftonline.com/11111111-1111-1111-1111-111111111111/oauth2/v2.0/token',
};
const vehicle = {
  registration: 'AB12CDE',
  make: 'EXAMPLE',
  model: 'HATCHBACK',
  firstUsedDate: '2012-03-01',
  manufactureDate: '2012-01-01',
  primaryColour: 'Blue',
  fuelType: 'Petrol',
  engineSize: '1598',
  vin: 'PRIVATE-VIN',
  motTests: [
    {
      completedDate: '2026-03-01T10:30:00.000Z',
      expiryDate: '2027-03-01',
      testResult: 'PASSED',
      odometerValue: '42000',
      odometerUnit: 'km',
      odometerResultType: 'READ',
      motTestNumber: 'PRIVATE-TEST',
      defects: [{ type: 'ADVISORY', text: 'Tyre worn', dangerous: false }],
    },
  ],
};
const token = () => Response.json({ access_token: 'test-token', expires_in: 3600 });

test('DVSA configuration requires all credentials without disclosing their values', () => {
  expect(() => readDvsaConfig({ DVSA_CLIENT_SECRET: 'private-secret' })).toThrow('DVSA_CLIENT_ID');
  try {
    readDvsaConfig({ DVSA_CLIENT_SECRET: 'private-secret' });
  } catch (error) {
    expect(String(error)).not.toContain('private-secret');
  }
  expect(
    readDvsaConfig({
      DVSA_CLIENT_ID: config.clientId,
      DVSA_CLIENT_SECRET: config.clientSecret,
      DVSA_API_KEY: config.apiKey,
      DVSA_SCOPE: config.scope,
      DVSA_TOKEN_URL: config.tokenUrl,
    }),
  ).toEqual(config);
});

test('DVSA rejects unsafe token destinations and unexpected scope before any request', () => {
  for (const tokenUrl of [
    'https://example.com/token',
    config.tokenUrl + '?x=1',
    config.tokenUrl.replace('https:', 'http:'),
  ]) {
    expect(() => createDvsaClient({ ...config, tokenUrl })).toThrow();
  }
  expect(() => createDvsaClient({ ...config, scope: 'https://example.com/.default' })).toThrow();
});

test('DVSA normalizes registration before routing and sends secrets only to approved endpoints', async () => {
  const requests: string[] = [];
  const client = createDvsaClient(config, {
    fetcher: async (url, init) => {
      requests.push(String(url));
      expect(init?.redirect).toBe('error');
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      const headers = new Headers(init?.headers);
      if (String(url) === config.tokenUrl) {
        const form = new URLSearchParams(String(init?.body));
        expect(form.get('client_secret')).toBe('private-secret');
        expect(form.get('grant_type')).toBe('client_credentials');
        expect(form.get('client_id')).toBe('test-client');
        expect(form.get('scope')).toBe(config.scope);
        expect(headers.has('X-API-Key')).toBe(false);
        return token();
      }
      expect(headers.get('Authorization')).toBe('Bearer test-token');
      expect(headers.get('X-API-Key')).toBe('private-key');
      return Response.json(vehicle);
    },
  });
  expect((await client.lookup('ab12 cde')).registration).toBe('AB12CDE');
  expect(requests).toEqual([
    config.tokenUrl,
    'https://history.mot.api.gov.uk/v1/trade/vehicles/registration/AB12CDE',
  ]);
});

test('invalid registrations never cause an authenticated lookup', async () => {
  let calls = 0;
  const client = createDvsaClient(config, {
    fetcher: async () => {
      calls++;
      return token();
    },
  });
  await expect(client.lookup('../bad')).rejects.toThrow('registration');
  expect(calls).toBe(0);
});

test('concurrent lookups share authentication, reuse tokens and refresh before expiry', async () => {
  let now = 0,
    tokenCalls = 0;
  const client = createDvsaClient(config, {
    now: () => now,
    fetcher: async (url) => {
      if (String(url) === config.tokenUrl) {
        tokenCalls++;
        await Promise.resolve();
        return token();
      }
      return Response.json(vehicle);
    },
  });
  await Promise.all([client.lookup('AB12CDE'), client.lookup('AB12CDE')]);
  await client.lookup('AB12CDE');
  expect(tokenCalls).toBe(1);
  now = 3_550_000;
  await client.lookup('AB12CDE');
  expect(tokenCalls).toBe(2);
});

test('failed token acquisition is safe and a subsequent explicit lookup can recover', async () => {
  let count = 0;
  const client = createDvsaClient(config, {
    fetcher: async (url) => {
      if (String(url) !== config.tokenUrl) return Response.json(vehicle);
      count++;
      return count === 1
        ? Response.json({ error_description: 'private-secret' }, { status: 401 })
        : token();
    },
  });
  await expect(client.lookup('AB12CDE')).rejects.toThrow('DVSA authentication failed');
  expect(count).toBe(1);
  expect((await client.lookup('AB12CDE')).make).toBe('EXAMPLE');
  expect(count).toBe(2);
});

test('malformed tokens and network failures expose no upstream diagnostics', async () => {
  for (const response of [
    { access_token: '', expires_in: 3600 },
    { access_token: 'test-token', expires_in: -1 },
  ]) {
    const client = createDvsaClient(config, { fetcher: async () => Response.json(response) });
    await expect(client.lookup('AB12CDE')).rejects.toThrow('DVSA authentication failed');
  }
  const client = createDvsaClient(config, {
    fetcher: async () => {
      throw new Error('private-secret');
    },
  });
  await expect(client.lookup('AB12CDE')).rejects.toThrow('DVSA authentication failed');
});

test('upstream lookup errors do not fall back, retry or expose response bodies', async () => {
  for (const status of [401, 404, 429, 500]) {
    let calls = 0;
    const client = createDvsaClient(config, {
      fetcher: async (url) => {
        calls++;
        return String(url) === config.tokenUrl ? token() : new Response('private-key', { status });
      },
    });
    try {
      await client.lookup('AB12CDE');
      throw new Error('Expected lookup failure');
    } catch (error) {
      expect(String(error)).not.toContain('private-key');
      expect(String(error)).toContain(status === 404 ? 'not found' : 'DVSA lookup failed');
    }
    expect(calls).toBe(2);
  }
});

test('normalization preserves evidence units and times while omitting private fields', () => {
  const result = normalizeDvsaVehicle(vehicle, 'AB12CDE');
  expect(result.make).toBe('EXAMPLE');
  expect(result.firstUsedDate).toBe('2012-03-01');
  expect(result.engineCapacityCc).toBe(1598);
  expect(result.motTests?.[0]).toEqual({
    completedDate: '2026-03-01T10:30:00.000Z',
    expiryDate: '2027-03-01',
    result: 'pass',
    odometer: { value: 42000, unit: 'km', resultType: 'READ' },
    defects: [{ type: 'ADVISORY', text: 'Tyre worn', dangerous: false }],
  });
  expect(JSON.stringify(result)).not.toContain('PRIVATE');
});

test('missing history differs from an explicitly empty history', () => {
  expect(
    normalizeDvsaVehicle({ ...vehicle, motTests: undefined }, 'AB12CDE').motTests,
  ).toBeUndefined();
  expect(normalizeDvsaVehicle({ ...vehicle, motTests: [] }, 'AB12CDE').motTests).toEqual([]);
  expect(() => normalizeDvsaVehicle({ ...vehicle, motTests: 'invalid' }, 'AB12CDE')).toThrow();
});

test('malformed identity and malformed test records are rejected rather than reported as no history', () => {
  for (const value of [
    null,
    [],
    {},
    { ...vehicle, registration: 'OTHER' },
    { ...vehicle, make: '' },
    { ...vehicle, motTests: [{}] },
  ]) {
    expect(() => normalizeDvsaVehicle(value, 'AB12CDE')).toThrow();
  }
});

test('unread or malformed odometers are never converted to usable mileage', () => {
  for (const fields of [
    { odometerValue: '-1' },
    { odometerValue: 'not read' },
    { odometerResultType: 'NOT READ' },
  ]) {
    const result = normalizeDvsaVehicle(
      { ...vehicle, motTests: [{ ...vehicle.motTests[0], ...fields }] },
      'AB12CDE',
    );
    expect(result.motTests?.[0]?.odometer.value).toBeNull();
  }
});
