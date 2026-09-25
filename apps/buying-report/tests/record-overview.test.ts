import { expect, test } from 'bun:test';
import { sampleReport } from '../fixtures/sample-report';
import { buildRecordOverview } from '../src/domain/record-overview';

test('counts supplied records and links attention items to their evidence', () => {
  const model = buildRecordOverview({
    ...sampleReport,
    evidence: {
      mot: [{ date: '2024-01-01', mileage: 62000, expiry: '2025-01-01', result: 'pass' }],
      tyres: [],
      notes: [],
    },
    detail: { registered: '2018-01-01', keepers: [{ date: '2020-01-01', previous: 1 }] },
    financeRecords: [{ company: 'Example Finance' }],
    checks: [
      { name: 'Finance', status: 'record-returned' },
      { name: 'Stolen status', status: 'not-checked' },
    ],
    historyEvents: [
      {
        date: '2021-01-01',
        title: 'Colour changed',
        text: 'A change was returned.',
        significant: true,
      },
    ],
  });
  expect(model.stats[0]).toEqual({ value: 4, label: 'records supplied', tone: 'neutral' });
  expect(model.stats[1]?.value).toBe(1);
  expect(model.stats[2]?.tone).toBe('pending');
  expect(model.attention.map((item) => item.href)).toEqual([
    '#history-event-colour-changed',
    '#history-check-finance',
  ]);
});

test('uses singular zero-safe wording', () => {
  const model = buildRecordOverview({
    ...sampleReport,
    evidence: { mot: [], tyres: [], notes: [] },
    historyEvents: [],
    financeRecords: [],
    detail: { registered: '2018-01-01', keepers: [] },
    checks: [],
  });
  expect(model.stats[0]).toEqual({ value: 0, label: 'records supplied', tone: 'neutral' });
  expect(model.whyItMatters).toContain('not the same as a current all-clear');
});
