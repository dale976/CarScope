import { test, expect } from 'bun:test';
import { readConfig } from '../src/server/config';
import { createApi } from '../src/server/api';
import { loadData, validateDataset } from '../src/server/data';
import fixture from '../fixtures/cars.json';

const config = readConfig({});
const api = createApi(config);
const request = (path: string) => api(new Request(`http://localhost/api/${path}`));

test('defaults to mock even when provider keys are supplied', () => {
  expect(readConfig({ MARKETCHECK_API_KEY: 'never-send' }).mode).toBe('mock');
});
test('live and unknown modes fail closed', () => {
  expect(() => readConfig({ DATA_MODE: 'live' })).toThrow('disabled');
  expect(() => readConfig({ DATA_MODE: 'typo' })).toThrow();
});
test('combined enthusiast filters return only matching listings', async () => {
  const response = await request('cars?q=Exige&maxPrice=70000&maxMileage=30000&features=Air%20conditioning');
  expect(response.status).toBe(200);
  const { cars } = await response.json();
  expect(cars.length).toBeGreaterThan(0);
  expect(cars.every((c: any) => c.model === 'Exige' && c.price <= 70000 && c.mileage <= 30000 && c.features.includes('Air conditioning'))).toBe(true);
});
test('invalid numeric filters return 400, not a silent empty result', async () => {
  expect((await request('cars?maxPrice=hello')).status).toBe(400);
  expect((await request('cars?maxMileage=-1')).status).toBe(400);
});
test('unknown sort returns 400', async () => {
  expect((await request('cars?sort=surprise')).status).toBe(400);
});
test('price sort is ascending and unmatched query is empty', async () => {
  const { cars } = await (await request('cars?sort=price-asc')).json();
  expect(cars.map((c: any) => c.price)).toEqual(cars.map((c: any) => c.price).sort((a: number,b: number) => a-b));
  expect((await (await request('cars?q=unicorn')).json()).cars).toEqual([]);
});
test('detail comparables match model and exclude current listing', async () => {
  const { car, comparables } = await (await request('cars/lotus-410-01')).json();
  expect(car.id).toBe('lotus-410-01');
  expect(comparables.length).toBeGreaterThan(0);
  expect(comparables.every((c: any) => c.id !== car.id && c.make === car.make && c.model === car.model)).toBe(true);
});
test('missing car returns 404', async () => {
  expect((await request('cars/missing')).status).toBe(404);
});
test('missing cache never falls back to fixture or network', async () => {
  await expect(loadData(readConfig({ DATA_MODE: 'cache', CAR_CACHE_PATH: '/tmp/carscope-does-not-exist-unique.json' }))).rejects.toThrow('cache');
});
test('invalid datasets and inconsistent history are rejected', () => {
  expect(() => validateDataset({ cars: [] })).toThrow();
  const invalid = structuredClone(fixture);
  invalid.cars[0]!.price = -1;
  expect(() => validateDataset(invalid)).toThrow();
});
test('no external fetch is used while searching or reading details', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (() => { calls++; throw new Error('Outbound request prohibited'); }) as unknown as typeof fetch;
  try {
    expect((await request('cars')).status).toBe(200);
    expect((await request('cars/lotus-410-01')).status).toBe(200);
    expect(calls).toBe(0);
  } finally { globalThis.fetch = original; }
});
test('status never exposes secrets', async () => {
  const response = await createApi(readConfig({ MARKETCHECK_API_KEY: 'private-sentinel' }))(new Request('http://localhost/api/status'));
  const body = await response.text();
  expect(body).not.toContain('private-sentinel');
  expect(JSON.parse(body).liveRequestsEnabled).toBe(false);
});
