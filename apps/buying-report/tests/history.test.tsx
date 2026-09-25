import { test, expect } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { VehicleStory, buildTimeline } from '../src/client/VehicleStory';
import { ReportView } from '../src/client/report/ReportView';
import { sampleReport } from '../fixtures/sample-report';
const detail = { registered: '2005-01-01', keepers: [] };
const mot = [
  {
    date: '2024-02-01T10:00:00Z',
    mileage: 90000,
    expiry: null,
    result: 'fail' as const,
    annotations: [{ type: 'DANGEROUS', text: 'Tyre cords exposed' }],
  },
  {
    date: '2024-02-01T11:00:00Z',
    mileage: 90000,
    expiry: '2025-01-31',
    result: 'pass' as const,
    annotations: [],
  },
];
test('same-day failed test retains its result and dangerous finding before a pass', () => {
  const events = buildTimeline(detail, mot);
  expect(events[1]?.title).toBe('MOT failed');
  expect(events[1]?.text).toContain('Tyre cords exposed');
  expect(events[2]?.title).toBe('MOT passed');
});
test('unknown result and absent mileage do not invent a pass or zero miles', () => {
  const events = buildTimeline(detail, [{ date: '2020-02-01', mileage: null, expiry: null }]);
  expect(events[1]?.title).toBe('MOT result unavailable');
  expect(events[1]?.text).toContain('Mileage unavailable');
  expect(events[1]?.text).not.toContain('no advisories');
});
test('long history offers chart and grouped years without invalid dates', () => {
  const html = renderToStaticMarkup(<VehicleStory detail={detail} mot={mot} />);
  expect(html).toContain('Recorded mileage');
  expect(html).toContain('Last 5 years');
  expect(html).toContain('1 pass');
  expect(html).toContain('1 fail');
  expect(html).not.toContain('Invalid Date');
  expect(html).toContain('Tyre cords exposed');
  expect(html).not.toMatch(/<option[^>]*>[^<]*10:00/);
  expect(html).not.toMatch(/<option[^>]*>[^<]*11:00/);
});
test('report shows exact valuation assumptions and unavailable sections', () => {
  const report = {
    ...sampleReport,
    costs: [],
    kind: 'sandbox-example' as const,
    evidence: {
      mot: [],
      tyres: [],
      notes: [],
      valuation: {
        date: '2026-09-20',
        mileage: 105553,
        figures: [{ label: 'Dealer forecourt', value: 2241 }],
      },
    },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  expect(html).toContain('£2,241');
  expect(html).toContain('105,553');
  expect(html).toContain('whether recorded damage history is reflected');
  expect(html).toContain('Tax status and rate unavailable');
  expect(html).toContain('Tyre fitment unavailable');
});

test('five-year mileage view uses the latest reading and keeps same-day tests', async () => {
  const { mileageReadings } = await import('../src/shared/history');
  const values = [
    { date: '2005-01-01', mileage: 100, expiry: null },
    { date: '2024-03-01', mileage: null, expiry: null },
    ...mot,
  ];
  expect(mileageReadings(values, true)).toEqual(mot);
  expect(mileageReadings([{ date: '2024-01-01', mileage: 0, expiry: null }])).toHaveLength(1);
});
test('significant events remain outside collapsed older years', () => {
  const html = renderToStaticMarkup(
    <VehicleStory
      detail={detail}
      mot={mot}
      events={[
        {
          date: '2010-01-01',
          title: 'Cat S recorded',
          text: 'Structural damage',
          significant: true,
        },
      ]}
    />,
  );
  expect(html).toContain('Significant recorded event');
  expect(html).toContain('Cat S recorded');
});
