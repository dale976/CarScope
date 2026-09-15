import fixture from '../../fixtures/cars.json';
import response from '../../fixtures/marketcheck/uk-active.json';
import { normalizeMockInventory } from './marketcheck';
import type { Dataset } from '../shared/types';
import type { Config } from './config';

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function validateDataset(value: unknown): Dataset {
  const fail = () => { throw new Error('Invalid dataset: expected normalized CarScope snapshot. See README.'); };
  if (!value || typeof value !== 'object') return fail();
  const d = value as Dataset;
  if (!validDate(d.asOf) || !['fictional', 'imported'].includes(d.source) || !Array.isArray(d.cars) || d.cars.length > 10000) return fail();
  const ids = new Set<string>();
  for (const c of d.cars) {
    if (!c || typeof c !== 'object') return fail();
    for (const key of ['id','make','model','trim','color','paint','transmission','location','fuel','seller','description'] as const) {
      if (typeof c[key] !== 'string' || !c[key].trim() || c[key].length > 5000) return fail();
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(c.id) || ids.has(c.id) || !/^#[a-fA-F0-9]{6}$/.test(c.color)) return fail();
    ids.add(c.id);
    for (const key of ['year','price','mileage','daysOnMarket'] as const) {
      if (!Number.isSafeInteger(c[key]) || c[key] < 0) return fail();
    }
    if (c.price === 0 || c.year < 1900 || c.year > Number(d.asOf.slice(0,4)) + 1) return fail();
    if (!Array.isArray(c.features) || c.features.some(f => typeof f !== 'string' || f.length > 200)) return fail();
    if (!Array.isArray(c.history) || !c.history.length) return fail();
    let previousDate = '';
    for (const point of c.history) {
      if (!point || !validDate(point.date) || point.date > d.asOf || point.date <= previousDate || !Number.isSafeInteger(point.price) || point.price <= 0) return fail();
      previousDate = point.date;
    }
    if (c.history.at(-1)!.price !== c.price) return fail();
  }
  // Copy only the public normalized fields. Unknown properties (including secrets) never reach the API.
  return { asOf: d.asOf, source: d.source, cars: d.cars.map(c => ({
    id:c.id, make:c.make, model:c.model, trim:c.trim, year:c.year, price:c.price,
    mileage:c.mileage, daysOnMarket:c.daysOnMarket, color:c.color, paint:c.paint,
    transmission:c.transmission, location:c.location, fuel:c.fuel, seller:c.seller,
    description:c.description, features:[...c.features], history:c.history.map(p => ({date:p.date,price:p.price}))
  })) };
}
export async function loadData(config: Config): Promise<Dataset> {
  if (config.mode === 'mock') return validateDataset(normalizeMockInventory(response, fixture));
  try {
    const file = Bun.file(config.cachePath);
    if (file.size > 20 * 1024 * 1024) throw new Error('Too large');
    return validateDataset(await file.json());
  } catch {
    throw new Error('Local cache is missing or invalid. Import a normalized snapshot or use DATA_MODE=mock. No live requests were made.');
  }
}
