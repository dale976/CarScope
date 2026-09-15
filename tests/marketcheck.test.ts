import {test,expect} from 'bun:test';
import {normalizeMockInventory} from '../src/server/marketcheck';
import response from '../fixtures/marketcheck/uk-active.json';
import demo from '../fixtures/cars.json';
test('normalizes documented UK fields and keeps synthetic detail separate',()=>{
 const data=normalizeMockInventory(response,demo);
 expect(data.cars[0]!.price).toBe(response.listings[0]!.price);
 expect(data.cars[0]!.mileage).toBe(response.listings[0]!.miles);
 expect(data.cars[0]!.daysOnMarket).toBe(response.listings[0]!.dom_active);
 expect(data.cars.map(c=>c.make)).not.toContain('Toyota');
 expect(new Set(data.cars.map(c=>c.make)).size).toBe(8);
});
test('missing optional mileage is rejected instead of invented',()=>{
 const incomplete=structuredClone(response) as any;delete incomplete.listings[0].miles;
 expect(()=>normalizeMockInventory(incomplete,demo)).toThrow();
});
