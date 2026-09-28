import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportView } from '../src/client/report/ReportView';
import { ReportContent } from '../src/client/ReportContent';
import { sampleReport } from '../fixtures/sample-report';
test('sample identifies evidence and never clears unperformed checks', () => {
  const html = renderToStaticMarkup(<ReportView report={sampleReport} />);
  for (const text of [
    'Fictional sample',
    'Not checked',
    'Personal quote needed',
    'Seller claim',
    'Illustrative estimate',
  ])
    expect(html).toContain(text);
  expect(html).not.toContain('History clear');
  expect(html).not.toContain('Verified valuation');
  expect(sampleReport.checks.every((c) => c.status === 'not-checked')).toBe(true);
  const fuel = (8000 / 45) * 4.54609 * 1.56;
  expect(Math.abs(sampleReport.costs[0]?.annualPounds - fuel)).toBeLessThan(1);
});
test('failed and loading states cannot display a report', () => {
  for (const state of [{ status: 'error' as const }, { status: 'loading' as const }]) {
    const html = renderToStaticMarkup(<ReportContent state={state} onLoad={() => {}} />);
    expect(html).not.toContain('Your buying brief');
    expect(html).toContain(state.status === 'error' ? 'Try again' : 'Preparing');
  }
});
test('sandbox report separates current mileage, benchmark and returned records', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    vehicle: { ...sampleReport.vehicle, askingPrice: null },
    checks: [
      { name: 'Finance' as const, status: 'record-returned' as const },
      { name: 'Stolen status' as const, status: 'none-returned' as const },
    ],
    evidence: {
      mot: [],
      valuation: {
        mileage: 13354,
        date: '2026-09-20',
        figures: [{ label: 'Dealer forecourt', value: 76344 }],
      },
      tyres: [],
      notes: ['Equipment lookup returned no results.'],
    },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  for (const text of [
    '13,354',
    '£76,344',
    'Record returned',
    'None returned',
    'Equipment: unavailable',
  ])
    expect(html).toContain(text);
  expect(html).not.toContain('Sandbox');
  expect(html).not.toContain('Fictional advert');
  expect(html).not.toContain('No commercial history service has been used');
});
test('API-only report handles unavailable mileage and costs without invented values', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    vehicle: { ...sampleReport.vehicle, mileage: null, askingPrice: null },
    costs: [],
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  expect(html).toContain('Mileage unavailable');
  expect(html).not.toContain('£0');
  expect(html).not.toContain('Owner-supplied mileage');
  expect(html).not.toContain('The seller’s offer');
});
test('tyre fitment explains run-flat status and supplied pressures', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    evidence: {
      mot: [],
      tyres: [
        {
          axle: 'Front',
          size: '235/45R18',
          rating: '98Y',
          runFlat: false,
          pressure: '42 psi / 2.9 bar',
        },
      ],
      notes: [],
    },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  for (const text of ['235/45R18', '98Y', 'Not run-flat', '42 psi / 2.9 bar'])
    expect(html).toContain(text);
});
test('EV report explains battery, efficiency and supplier charging times without claiming battery health', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    ev: {
      generatedAt: '2025-04-16',
      totalCapacityKwh: 75,
      usableCapacityKwh: 72.5,
      consumptionWhMile: 316,
      rangeMiles: 237,
      maxChargeKw: 142,
      batteryWarrantyMonths: 96,
      batteryWarrantyMiles: 150000,
      healthStatus: 'not-tested' as const,
      superchargerCompatible: true,
      ports: [
        {
          type: 'Type 2',
          location: 'Left/Rear',
          maxKw: 16.6,
          times: [
            { powerKw: 2.3, minutes: 1957 },
            { powerKw: 7.5, minutes: 600 },
            { powerKw: 11, minutes: 409 },
          ],
        },
        {
          type: 'CCS',
          location: 'Left/Rear',
          maxKw: 142,
          times: [
            { powerKw: 50, minutes: 140 },
            { powerKw: 142, minutes: 49 },
          ],
        },
      ],
    },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  for (const text of [
    '72.5 kWh usable',
    '316 Wh/mile',
    '3.16 miles/kWh',
    '237 miles',
    'Type 2',
    'CCS',
    '32 hr 37 min',
    '49 min',
    'Battery health not tested',
    '8 years / 150,000 miles',
  ])
    expect(html).toContain(text);
  expect(html).not.toContain('Current battery health: good');
});
test('report leads with a factual record overview rather than a vehicle rating', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    historyEvents: [
      {
        date: '2020-01-01',
        title: 'Recorded damage marker',
        text: 'A significant event was returned.',
        significant: true,
      },
    ],
    checks: [
      { name: 'Finance' as const, status: 'none-returned' as const },
      { name: 'Stolen status' as const, status: 'record-returned' as const },
      { name: 'Insurance write-off' as const, status: 'not-checked' as const },
    ],
    evidence: { mot: [], tyres: [], notes: [] },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  for (const text of [
    'Record overview',
    '1 record supplied',
    '1 check returned a record',
    '1 check not completed',
    'Recorded damage marker',
    'Why this matters',
    'What to do next',
    'This is not a vehicle rating or buying recommendation',
  ])
    expect(html).toContain(text);
  expect(html).not.toContain('Vehicle score');
  expect(html.indexOf('Record overview')).toBeLessThan(html.indexOf('Vehicle details'));
  expect(html.indexOf('Vehicle details')).toBeLessThan(html.indexOf('History and mileage'));
  expect(html.indexOf('History and mileage')).toBeLessThan(html.indexOf('Value and ownership'));
  expect(html.indexOf('Value and ownership')).toBeLessThan(html.indexOf('Before you buy'));
});
test('report identifies the registration and names records requiring attention', () => {
  const report = {
    ...sampleReport,
    registration: 'SL60AUC',
    historyEvents: [
      {
        date: '2020-01-01',
        title: 'Recorded damage marker',
        text: 'A significant event was returned.',
        significant: true,
      },
    ],
    checks: [
      { name: 'Finance' as const, status: 'none-returned' as const },
      { name: 'Stolen status' as const, status: 'record-returned' as const },
      { name: 'Insurance write-off' as const, status: 'not-checked' as const },
    ],
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  for (const text of [
    'Registration',
    'SL60 AUC',
    'Recorded damage marker',
    'Stolen status · Record returned',
  ])
    expect(html).toContain(text);
  expect(html).toContain('href="#history-event-recorded-damage-marker"');
  expect(html).toContain('href="#history-check-stolen-status"');
});
test('a returned finance record is prominent and explains the required follow-up', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    financeRecords: [
      {
        agreementDate: '2026-06-01',
        agreementType: 'Hire purchase',
        termMonths: 60,
        company: 'JBR Capital',
        contactNumber: '01234 567890',
        vehicleDescription: 'Lotus Exige Sport 410',
      },
    ],
    checks: [
      { name: 'Finance' as const, status: 'record-returned' as const },
      { name: 'Stolen status' as const, status: 'none-returned' as const },
      { name: 'Insurance write-off' as const, status: 'none-returned' as const },
    ],
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  expect(html).toContain('Finance record returned');
  expect(html).toContain(
    'Confirm its current status and obtain evidence of settlement before purchase.',
  );
  expect(html).toContain('href="#history-check-finance"');
  for (const text of ['Hire purchase', 'JBR Capital', '1 Jun 2026', '60 months', '01234 567890'])
    expect(html).toContain(text);
  expect(html).not.toContain('Agreement number');
  const overview = html.slice(html.indexOf('Record overview'), html.indexOf('Vehicle details'));
  expect(overview).toContain('Finance record returned');
});
test('report ignores legacy buyer inputs and keeps registration with vehicle identity', () => {
  const report = {
    ...sampleReport,
    registration: 'SL60AUC',
    buyerInputs: { mileage: 12345, askingPrice: 9999 },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  expect(html).not.toContain('Your information');
  expect(html).not.toContain('Buyer supplied');
  const vehicle = html.slice(
    html.indexOf('class="vehicle-bar"'),
    html.indexOf('</section>', html.indexOf('class="vehicle-bar"')),
  );
  expect(vehicle).toContain('SL60 AUC');
  expect(vehicle).toContain('</div><div class="vehicle-registration">');
  expect(vehicle).not.toContain('Asking price');
  expect(vehicle).not.toContain('Not a valuation');
});
test('current MOT and tax status are prominent and record counts include MOT history', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    motStatus: { status: 'valid' as const, expiry: '2027-08-30', source: 'supplier' as const },
    tax: {
      status: 'taxed' as const,
      dueDate: '2027-03-01',
      date: '2026-09-20',
      rates: [{ label: 'Standard annual rate', amount: 195 }],
    },
    detail: { registered: '2018-01-01', keepers: [{ date: '2024-01-01', previous: 2 }] },
    historyEvents: [],
    evidence: {
      mot: [
        {
          date: '2026-08-30',
          mileage: 50000,
          expiry: '2027-08-30',
          result: 'pass' as const,
          annotations: [],
        },
        {
          date: '2025-08-30',
          mileage: 45000,
          expiry: '2026-08-29',
          result: 'pass' as const,
          annotations: [],
        },
      ],
      tyres: [],
      notes: [],
    },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  for (const text of [
    'MOT valid',
    'Current through 30 Aug 2027',
    'Taxed',
    'Current through 1 Mar 2027',
    '3 records supplied',
    '2 MOT tests',
    '1 keeper change',
  ])
    expect(html).toContain(text);
});
test('expired and SORN states do not look like clear checks', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    motStatus: { status: 'expired' as const, expiry: '2025-01-10', source: 'derived' as const },
    tax: { status: 'sorn' as const, rates: [] },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  expect(html).toContain('MOT expired');
  expect(html).toContain('SORN');
  expect(html).not.toContain('Taxed');
});
test('complete report derives a missing MOT status from the latest returned test', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    motStatus: undefined,
    evidence: {
      mot: [
        {
          date: '2026-04-24',
          mileage: 8541,
          expiry: '2027-05-10',
          result: 'pass' as const,
          annotations: [],
        },
      ],
      tyres: [],
      notes: [],
    },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  expect(html).toContain('MOT valid');
  expect(html).toContain('Current through 10 May 2027');
  expect(html).not.toContain('MOT status unavailable');
});
test('an old tax observation is not labelled as current in the complete report', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    tax: { status: 'untaxed' as const, date: '2024-05-12', dueDate: '2024-06-01', rates: [] },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  expect(html).toContain('Supplier record dated 12 May 2024');
  expect(html).not.toContain('Current tax status');
  expect(html).not.toContain('<span>Current status</span>');
});

test('buyer briefing prioritises a returned finance record and links to its evidence', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    financeRecords: [
      { agreementDate: '2026-06-01', agreementType: 'Hire purchase', company: 'JBR Capital' },
    ],
    checks: [
      { name: 'Finance' as const, status: 'record-returned' as const },
      { name: 'Stolen status' as const, status: 'none-returned' as const },
      { name: 'Insurance write-off' as const, status: 'none-returned' as const },
    ],
    sellerQuestions: [
      'Can you confirm the recorded finance has been settled, or explain how settlement will be completed?',
      'Can I see the complete service history?',
    ],
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  const briefing = html.slice(html.indexOf('Your buyer briefing'), html.indexOf('Vehicle details'));
  for (const text of [
    'What the records indicate',
    'One item to resolve',
    'Outstanding finance recorded',
    'Before you view the car',
    'What the records cannot confirm',
  ])
    expect(briefing).toContain(text);
  expect(briefing).toContain('href="#history-check-finance"');
  expect(briefing).toContain('evidence that the agreement will be settled');
  expect(briefing).not.toContain('Can you confirm the recorded finance has been settled');
  expect(briefing).not.toContain('safe to buy');
});

test('buyer briefing explains sparse older history without treating missing data as clear', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    vehicle: { ...sampleReport.vehicle, year: 1982, mileage: 33830 },
    detail: {
      registered: '2022-08-01',
      keepers: [
        { date: '2024-07-26', previous: 2 },
        { date: '2023-09-22', previous: 1 },
      ],
    },
    historyEvents: [],
    checks: [
      { name: 'Finance' as const, status: 'none-returned' as const },
      { name: 'Stolen status' as const, status: 'none-returned' as const },
      { name: 'Insurance write-off' as const, status: 'none-returned' as const },
    ],
    evidence: {
      mot: [
        {
          date: '2024-02-20',
          mileage: null,
          expiry: '2025-02-19',
          result: 'pass' as const,
          annotations: [],
        },
        {
          date: '2023-06-06',
          mileage: 33830,
          expiry: '2024-06-23',
          result: 'pass' as const,
          annotations: [],
        },
      ],
      tyres: [],
      notes: [],
    },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  const briefing = html.slice(html.indexOf('Your buyer briefing'), html.indexOf('Vehicle details'));
  expect(briefing).toContain('The available history is incomplete');
  expect(briefing).toContain('mileage was supplied for only 1 of 2 MOT records');
  expect(briefing).toContain('Request older MOT certificates and service invoices');
  expect(briefing).not.toContain('history is clear');
});

test('buyer briefing gives relevant EV questions and states that battery health is unknown', () => {
  const report = {
    ...sampleReport,
    kind: 'sandbox-example' as const,
    ev: { rangeMiles: 237, maxChargeKw: 142, healthStatus: 'not-tested' as const, ports: [] },
  };
  const html = renderToStaticMarkup(<ReportView report={report} />);
  const briefing = html.slice(html.indexOf('Your buyer briefing'), html.indexOf('Vehicle details'));
  expect(briefing).toContain('Battery health is not measured by these records');
  expect(briefing).toContain('Ask for a current battery-health assessment');
});
