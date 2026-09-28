import { expect, test } from 'bun:test';
import { sampleReport } from '../fixtures/sample-report';
import { buildBuyerBriefing } from '../src/domain/buyer-briefing';

test('prioritises finance and removes duplicate finance questions', () => {
  const briefing = buildBuyerBriefing({
    ...sampleReport,
    checks: [{ name: 'Finance', status: 'record-returned' }],
    sellerQuestions: ['Is the finance settled?', ...sampleReport.sellerQuestions],
  });
  expect(briefing.priority?.title).toBe('Outstanding finance recorded');
  expect(briefing.priority?.href).toBe('#history-check-finance');
  expect(briefing.questions.filter((question) => /finance|settle/i.test(question))).toHaveLength(1);
  expect(briefing.questions.length).toBeLessThanOrEqual(4);
});

test('describes sparse older evidence without claiming a clear history', () => {
  const briefing = buildBuyerBriefing({
    ...sampleReport,
    vehicle: { ...sampleReport.vehicle, year: 1982 },
    evidence: {
      mot: [
        { date: '2024-01-01', mileage: null, expiry: '2025-01-01', result: 'pass' },
        { date: '2023-01-01', mileage: 30000, expiry: '2024-01-01', result: 'pass' },
      ],
      tyres: [],
      notes: [],
    },
  });
  expect(briefing.summary).toContain('available history is incomplete');
  expect(briefing.summary).toContain('only 1 of 2 MOT records');
});

test('explains EV battery limits and falls back to significant events', () => {
  const briefing = buildBuyerBriefing({
    ...sampleReport,
    ev: { healthStatus: 'not-tested', ports: [] },
    historyEvents: [
      {
        date: '2020-01-01',
        title: 'Recorded keeper change',
        text: 'A change was returned.',
        significant: true,
      },
    ],
  });
  expect(briefing.priority?.title).toBe('Recorded keeper change');
  expect(briefing.limitation).toContain('Battery health is not measured');
});
