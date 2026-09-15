import type { Car, Dataset, SearchResult } from '../shared/types';
export class QueryError extends Error {}
function maximum(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  if (!raw) return Infinity;
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(n)) throw new QueryError(`${key} must be a non-negative whole number.`);
  return n;
}
export function search(data: Dataset, params: URLSearchParams): SearchResult {
  const maxPrice = maximum(params, 'maxPrice');
  const maxMileage = maximum(params, 'maxMileage');
  const q = (params.get('q') ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const make = (params.get('make') ?? '').toLowerCase();
  const features = (params.get('features') ?? '').split(',').map(f => f.trim().toLowerCase()).filter(Boolean);
  const sort = params.get('sort') || 'recent';
  if (!['recent','price-asc','price-desc','mileage','days'].includes(sort)) throw new QueryError('Unknown sort order.');
  const cars = data.cars.filter(c => {
    const text = `${c.make} ${c.model} ${c.trim} ${c.transmission} ${c.paint} ${c.features.join(' ')}`.toLowerCase();
    return q.every(word => text.includes(word)) && (!make || c.make.toLowerCase() === make) && c.price <= maxPrice && c.mileage <= maxMileage && features.every(f => c.features.some(cf => cf.toLowerCase() === f));
  });
  const order: Record<string, (a: Car,b: Car) => number> = {
    recent: (a,b) => a.daysOnMarket-b.daysOnMarket, 'price-asc': (a,b) => a.price-b.price,
    'price-desc': (a,b) => b.price-a.price, mileage: (a,b) => a.mileage-b.mileage, days: (a,b) => b.daysOnMarket-a.daysOnMarket,
  };
  cars.sort(order[sort]);
  return {cars, total: cars.length, makes:[...new Set(data.cars.map(c => c.make))].sort(), features:[...new Set(data.cars.flatMap(c => c.features))].sort(), asOf:data.asOf, source:data.source};
}
export function comparableCars(data: Dataset, car: Car) {
  return data.cars.filter(c => c.id !== car.id && c.make === car.make && c.model === car.model)
    .sort((a,b) => Math.abs(a.mileage-car.mileage)-Math.abs(b.mileage-car.mileage)).slice(0,4);
}
