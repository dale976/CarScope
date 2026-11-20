import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { VehiclePreviewCard } from '../src/client/VehiclePreview';
import type { VehiclePreview } from '../src/shared/preview';

const preview: VehiclePreview = {
  previewId: 'one',
  registration: 'LD17VAE',
  source: 'mock',
  vehicle: { name: 'Tesla Model X 75D', year: 2017, fuelType: 'Electric', colour: 'Black' },
  mot: { status: 'valid', expiry: '2027-01-01' },
  tax: { status: 'taxed', dueDate: '2027-02-01' },
  coverage: { motRecordCount: 8, message: '8 MOT tests returned' },
};
test('focused preview shows returned evidence and the planned price without paid findings', () => {
  const html = renderToStaticMarkup(
    <VehiclePreviewCard
      preview={preview}
      mode="mock"
      busy={false}
      onBack={() => {}}
      onGenerate={() => {}}
    />,
  );
  for (const text of [
    'Vehicle identified',
    'LD17 VAE',
    'MOT valid',
    '8 MOT tests returned',
    'Complete buying report',
    '£9.99',
  ])
    expect(html).toContain(text);
  expect(html).toContain('class="preview-status" data-state="valid"');
  expect(html).toContain('class="preview-status" data-state="taxed"');
  expect(html).not.toContain('Finance record');
  expect(html).not.toContain('Complete history');
  expect(html).not.toContain('supplier call');
});
test('preview explains later UK records without offering legacy paid lookups', () => {
  const imported = {
    ...preview,
    registration: 'E824MAS',
    coverage: {
      motRecordCount: 3,
      ukRecordStart: '2022-08-01',
      message: '3 MOT tests returned since UK registration in 2022',
    },
  };
  const html = renderToStaticMarkup(
    <VehiclePreviewCard
      preview={imported}
      mode="live"
      busy={false}
      onBack={() => {}}
      onGenerate={() => {}}
    />,
  );
  expect(html).toContain('3 MOT tests returned since UK registration in 2022');
  expect(html).not.toContain('3 supplier calls');
});
test('preview does not turn absent MOT evidence into reassurance', () => {
  const empty = {
    ...preview,
    mot: undefined,
    coverage: { motRecordCount: 0, message: 'No MOT tests returned' },
  };
  const html = renderToStaticMarkup(
    <VehiclePreviewCard
      preview={empty}
      mode="mock"
      busy={false}
      onBack={() => {}}
      onGenerate={() => {}}
    />,
  );
  expect(html).toContain('No MOT tests returned');
  expect(html).toContain('MOT status not established');
  expect(html.match(/class="preview-status" data-state="unavailable"/g)).toHaveLength(1);
});
test('preview explains an expected empty MOT history for a young car', () => {
  const young = {
    ...preview,
    registration: 'DF74FPA',
    vehicle: {
      ...preview.vehicle,
      name: 'Porsche 718 Boxster GTS 4.0 PDK',
      year: 2024,
      registered: '2024-11-22',
    },
    mot: { status: 'not-yet-due' as const, dueDate: '2027-11-22' },
    coverage: { motRecordCount: 0, message: 'No MOT tests expected before the first test is due' },
  };
  const html = renderToStaticMarkup(
    <VehiclePreviewCard
      preview={young}
      mode="mock"
      busy={false}
      onBack={() => {}}
      onGenerate={() => {}}
    />,
  );
  expect(html).toContain('First registered 22 Nov 2024');
  expect(html).toContain('First MOT not yet due');
  expect(html).toContain('Usually due by 22 Nov 2027');
  expect(html).not.toContain('MOT status not established');
});

test('official preview shows detailed dated evidence, UAT warning and disabled paid action', () => {
  const official: VehiclePreview = {
    ...preview,
    source: 'official',
    previewId: '',
    vehicle: {
      ...preview.vehicle,
      firstRegistered: '2017-03',
      engineCapacity: 0,
      co2Emissions: 0,
      markedForExport: false,
      dateOfLastV5CIssued: '2025-01-03',
    },
    recordedMileage: { value: 8541, unit: 'mi', date: '2026-04-24T12:00:00' },
    motHistory: [
      {
        completedDate: '2026-04-24T12:00:00',
        result: 'pass',
        odometer: { value: 8541, unit: 'mi', resultType: 'READ' },
        defects: [{ type: 'ADVISORY', text: 'Tyre worn', dangerous: false }],
      },
    ],
    official: {
      testData: true,
      retrievedAt: '2026-11-20T12:00:00Z',
      sources: { dvla: 'available', dvsa: 'available' },
      motSource: 'DVLA',
      notes: ['DVLA UAT returns predefined test data.'],
    },
  };
  const html = renderToStaticMarkup(
    <VehiclePreviewCard
      preview={official}
      mode="official"
      busy={false}
      onBack={() => {}}
      onGenerate={() => {}}
    />,
  );
  for (const text of [
    '8,541',
    '24 Apr 2026',
    'Mar 2017',
    'MOT history',
    'Tyre worn',
    'ADVISORY',
    'DVLA',
    'DVSA',
    'Test data',
    'not current mileage',
    'ownership change',
  ])
    expect(html).toContain(text);
  expect(html).toContain('disabled');
  expect(html).not.toContain('View complete report · £9.99');
  expect(html).not.toContain('3 supplier calls');
});

test('official partial preview shows missing history without implying no defects', () => {
  const html = renderToStaticMarkup(
    <VehiclePreviewCard
      preview={{
        ...preview,
        source: 'official',
        motHistory: undefined,
        official: {
          testData: false,
          retrievedAt: '2026-11-20T12:00:00Z',
          sources: { dvla: 'available', dvsa: 'unavailable' },
          notes: ['DVSA MOT history could not be checked.'],
        },
      }}
      mode="official"
      busy={false}
      onBack={() => {}}
      onGenerate={() => {}}
    />,
  );
  expect(html).toContain('DVSA MOT history could not be checked.');
  expect(html).toContain('MOT history unavailable');
  expect(html).not.toContain('No defects');
});

test('official negative statuses never describe a future date as current coverage', () => {
  const html = renderToStaticMarkup(
    <VehiclePreviewCard
      preview={{
        ...preview,
        source: 'official',
        mot: { status: 'not-valid', expiry: '2027-05-10' },
        tax: { status: 'untaxed', dueDate: '2027-06-01' },
      }}
      mode="official"
      busy={false}
      onBack={() => {}}
      onGenerate={() => {}}
    />,
  );
  expect(html).not.toContain('Current through');
  expect(html).toContain('Tax due');
  expect(html).toContain('Recorded MOT expiry');
});
test('an official preview can never enable payment when displayed under a stale mock mode', () => {
  const html = renderToStaticMarkup(
    <VehiclePreviewCard
      preview={{ ...preview, source: 'official' }}
      mode="mock"
      busy={false}
      onBack={() => {}}
      onGenerate={() => {}}
    />,
  );
  expect(html).toContain('disabled');
  expect(html).not.toContain('View complete report · £9.99');
});
