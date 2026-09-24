import { expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fixture from '../fixtures/cars.json';
import { loadData, validateDataset } from '../src/server/data';
import { readConfig } from '../src/server/config';
import { createApi } from '../src/server/api';

test('reads validated local snapshots without network access', async () => {
  const dir = await mkdtemp(join(tmpdir(),'carscope-test-'));
  try {
    const path = join(dir,'cars.json');
    await Bun.write(path,JSON.stringify({...fixture,source:'imported'}));
    const data=await loadData(readConfig({DATA_MODE:'cache',CAR_CACHE_PATH:path}));
    expect(data.source).toBe('imported');
    expect(data.cars).toHaveLength(12);
    const response=await createApi(readConfig({DATA_MODE:'cache',CAR_CACHE_PATH:path}))(new Request('http://localhost/api/status'));
    expect((await response.json()).mode).toBe('cache');
    await Bun.write(path,'invalid-json');
    expect((await createApi(readConfig({DATA_MODE:'cache',CAR_CACHE_PATH:path}))(new Request('http://localhost/api/cars'))).status).toBe(503);
  } finally {await rm(dir,{recursive:true,force:true});}
});
test('strips unrecognized fields and rejects duplicate IDs', () => {
  const extra=structuredClone(fixture) as any;
  extra.cars[0].api_key='secret-sentinel';
  expect(JSON.stringify(validateDataset(extra))).not.toContain('secret-sentinel');
  extra.cars.push(extra.cars[0]);
  expect(()=>validateDataset(extra)).toThrow();
});
test('rejects impossible or reversed dates and inconsistent latest prices', () => {
  const badDate=structuredClone(fixture);badDate.asOf='2026-02-30';
  expect(()=>validateDataset(badDate)).toThrow();
  const history=structuredClone(fixture);history.cars[0]!.history.reverse();
  expect(()=>validateDataset(history)).toThrow();
  const price=structuredClone(fixture);price.cars[0]!.history.at(-1)!.price=1;
  expect(()=>validateDataset(price)).toThrow();
});
