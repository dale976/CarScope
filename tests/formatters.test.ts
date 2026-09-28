import { expect, test } from 'bun:test';
import {
  formatDate,
  formatDuration,
  formatMoney,
  formatRegistration,
} from '../src/domain/formatters';
import { buildMotDisplay, buildTaxDisplay } from '../src/domain/vehicle-status';

test('formats report values consistently', () => {
  expect(formatMoney(76344)).toBe('£76,344');
  expect(formatDuration(1957)).toBe('32 hr 37 min');
  expect(formatRegistration('sl60auc')).toBe('SL60 AUC');
  expect(formatRegistration('A1')).toBe('A1');
  expect(formatDate('2026-09-20')).toBe('20 Sep 2026');
});

test('invalid formatter inputs stay unavailable', () => {
  expect(formatMoney(Number.NaN)).toBe('Unavailable');
  expect(formatDuration(Number.NaN)).toBe('Unavailable');
  expect(formatDate('Date unavailable')).toBe('Unavailable');
});

test('builds honest vehicle status displays', () => {
  expect(buildMotDisplay({ status: 'valid', dueDate: '2027-05-10' }).label).toBe('MOT valid');
  expect(buildTaxDisplay(undefined).label).toBe('Tax status unavailable');
  expect(buildTaxDisplay({ status: 'taxed', sourceDate: '2024-01-01' }).detail).toContain(
    'Supplier record dated 1 Jan 2024',
  );
});
