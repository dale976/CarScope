import {describe,expect,test} from 'bun:test';
import {testVehicles} from '../src/shared/test-vehicles';

describe('sandbox test vehicle catalogue',()=>{
 test('contains 30 unique registrations accepted by the sandbox rule',()=>{
  const registrations=testVehicles.map(vehicle=>vehicle.registration.replace(/\s/g,''));
  expect(testVehicles).toHaveLength(30);
  expect(new Set(registrations).size).toBe(30);
  expect(registrations.every(registration=>registration.includes('A'))).toBe(true);
 });

 test('covers different ages and vehicle types',()=>{
  expect(new Set(testVehicles.map(vehicle=>vehicle.era))).toEqual(new Set(['current','modern','classic']));
  expect(new Set(testVehicles.map(vehicle=>vehicle.type)).size).toBeGreaterThanOrEqual(7);
 });

 test('keeps provenance for every sourced registration',()=>{
  expect(testVehicles.every(vehicle=>vehicle.sourceLabel&&vehicle.sourceUrl)).toBe(true);
 });
});
