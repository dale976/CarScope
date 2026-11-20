import { expect, test } from 'bun:test';
import { createDvlaClient, readDvlaConfig } from '../src/server/dvla/client';
import { normalizeDvlaVehicle } from '../src/server/dvla/normalize';

const vehicle = {
  registrationNumber: 'YJ22ACU',
  make: 'LOTUS',
  taxStatus: 'Taxed',
  taxDueDate: '2027-06-01',
  motStatus: 'Valid',
  motExpiryDate: '2027-05-10',
  yearOfManufacture: 2022,
  monthOfFirstRegistration: '2022-05',
  engineCapacity: 3456,
  co2Emissions: 230,
  markedForExport: false,
  colour: 'BLUE',
  fuelType: 'PETROL',
  dateOfLastV5CIssued: '2026-06-02',
  wheelplan: '2 AXLE RIGID BODY',
};
test('DVLA sends normalized VRN only in POST body to selected fixed host', async () => {
  let calls = 0;
  const client = createDvlaClient(
    readDvlaConfig({ DVLA_API_KEY: 'secret', DVLA_ENVIRONMENT: 'development' }),
    {
      fetcher: async (url, init) => {
        calls++;
        expect(String(url)).toBe(
          'https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
        );
        expect(init?.method).toBe('POST');
        expect(new Headers(init?.headers).get('x-api-key')).toBe('secret');
        expect(JSON.parse(String(init?.body))).toEqual({ registrationNumber: 'YJ22ACU' });
        expect(init?.redirect).toBe('error');
        expect(init?.signal).toBeInstanceOf(AbortSignal);
        return Response.json(vehicle);
      },
    },
  );
  expect((await client.lookup('yj22 acu')).make).toBe('LOTUS');
  await expect(client.lookup('../bad')).rejects.toThrow('registration');
  expect(calls).toBe(1);
});
test('DVLA validates environment and routes production without arbitrary URLs', async () => {
  expect(() => readDvlaConfig({ DVLA_API_KEY: 'secret', DVLA_ENVIRONMENT: 'bad' })).toThrow();
  expect(() => readDvlaConfig({})).toThrow('DVLA_API_KEY');
  const client = createDvlaClient(
    readDvlaConfig({ DVLA_API_KEY: 'key', DVLA_ENVIRONMENT: 'production' }),
    {
      fetcher: async (url) => {
        expect(String(url)).toBe(
          'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
        );
        return Response.json(vehicle);
      },
    },
  );
  await client.lookup('YJ22ACU');
});
test('DVLA selects separate test and production keys without sending the other key', async () => {
  const env = { DVLA_TEST_API_KEY: 'test-key', DVLA_PROD_API_KEY: 'prod-key' };
  expect(readDvlaConfig({ ...env, DVLA_ENVIRONMENT: 'development' }).apiKey).toBe('test-key');
  expect(readDvlaConfig({ ...env, DVLA_ENVIRONMENT: 'production' }).apiKey).toBe('prod-key');
});
test('DVLA preserves precision, zero and false, handles aliases and projects public fields only', () => {
  const result = normalizeDvlaVehicle(
    { ...vehicle, co2Emissions: 0, ignored: 'private' },
    'YJ22ACU',
  );
  expect(result.firstRegistered).toBe('2022-05');
  expect(result.motExpiry).toBe('2027-05-10');
  expect(result.co2Emissions).toBe(0);
  expect(result.markedForExport).toBe(false);
  expect(JSON.stringify(result)).not.toContain('private');
  expect(
    normalizeDvlaVehicle(
      {
        registrationNumber: 'YJ22ACU',
        make: 'LOTUS',
        monthOfFirstRegistration: 5,
        yearOfFirstRegistration: 2022,
        motExpiry: '2027-05-10',
        wheelPlan: 'RIGID',
      },
      'YJ22ACU',
    ).firstRegistered,
  ).toBe('2022-05');
});
test('DVLA refuses identity mismatch, impossible dates, malformed facts and conflicting aliases', () => {
  for (const patch of [
    { registrationNumber: 'OTHER' },
    { taxDueDate: '2027-02-30' },
    { engineCapacity: '3456' },
    { markedForExport: 'false' },
    { motExpiry: '2028-01-01' },
    { monthOfFirstRegistration: '2022-13' },
  ]) {
    expect(() => normalizeDvlaVehicle({ ...vehicle, ...patch }, 'YJ22ACU')).toThrow();
  }
});
test('DVLA rejects rapid requests without a queue or retries', async () => {
  let calls = 0;
  let time = 0;
  const client = createDvlaClient(
    { apiKey: 'key', environment: 'development' },
    {
      now: () => time,
      fetcher: async () => {
        calls++;
        return Response.json(vehicle);
      },
    },
  );
  await client.lookup('YJ22ACU');
  await expect(client.lookup('YJ22ACU')).rejects.toThrow('busy');
  time = 500;
  await client.lookup('YJ22ACU');
  expect(calls).toBe(2);
});
test('DVLA errors do not expose response bodies, keys or retry automatically', async () => {
  for (const status of [400, 401, 403, 404, 429, 500, 503]) {
    let calls = 0;
    const client = createDvlaClient(
      { apiKey: 'private-key', environment: 'development' },
      {
        fetcher: async () => {
          calls++;
          return new Response('private-upstream-body', { status });
        },
      },
    );
    try {
      await client.lookup('YJ22ACU');
      throw new Error('Unexpected success');
    } catch (e) {
      const message = String(e);
      expect(message).not.toContain('private-key');
      expect(message).not.toContain('private-upstream-body');
      expect(message).toContain(
        status === 404 ? 'not found' : status === 429 ? 'busy' : 'unavailable',
      );
    }
    expect(calls).toBe(1);
  }
});
test('DVLA network and malformed JSON failures stay safe', async () => {
  for (const fetcher of [
    async () => {
      throw new Error('private network diagnostic');
    },
    async () => new Response('not-json'),
  ]) {
    const client = createDvlaClient({ apiKey: 'key', environment: 'development' }, { fetcher });
    await expect(client.lookup('YJ22ACU')).rejects.toThrow('DVLA');
  }
});
