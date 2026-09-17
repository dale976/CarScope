import { test, expect } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initializeBudget, reserveSearchCall, readBudget } from '../src/server/budget';

function isolated(run: (path: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'carscope-budget-'));
  try { run(join(dir, 'budget.sqlite')); } finally { rmSync(dir, { recursive: true, force: true }); }
}
test('£10 cumulative allowance persists and blocks request 501', () => isolated(path => {
  initializeBudget(path);
  for (let i = 0; i < 500; i++) reserveSearchCall(path);
  expect(readBudget(path)).toEqual({ limitPence: 1000, reservedPence: 1000, remainingPence: 0 });
  expect(() => reserveSearchCall(path)).toThrow('budget exhausted');
  expect(() => initializeBudget(path)).toThrow();
  expect(readBudget(path).reservedPence).toBe(1000);
}));
test('missing or corrupt accounting fails closed', () => isolated(path => {
  expect(() => reserveSearchCall(path)).toThrow();
  writeFileSync(path, 'broken');
  expect(() => reserveSearchCall(path)).toThrow();
}));
test('reservations are charged before a request and never refunded automatically', () => isolated(path => {
  initializeBudget(path);
  reserveSearchCall(path);
  expect(readBudget(path).remainingPence).toBe(998);
}));
