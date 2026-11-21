import { expect, test } from 'bun:test';
import { generateSandboxReport } from '../src/server/sandbox-report';
import type { VehiclePreview } from '../src/shared/preview';

const preview: VehiclePreview = {
  previewId: 'session',
  registration: 'YJ22ACU',
  source: 'official',
  vehicle: {
    name: 'LOTUS EXIGE',
    year: 2022,
    firstRegistered: '2022-05',
    colour: 'BLUE',
    fuelType: 'PETROL',
  },
  mot: { status: 'valid', expiry: '2027-05-10' },
  tax: { status: 'taxed', dueDate: '2027-06-01' },
  recordedMileage: { value: 8541, unit: 'MI', date: '2026-04-24T12:00:00' },
  motHistory: [
    {
      completedDate: '2026-04-24T12:00:00',
      expiryDate: '2027-05-10',
      result: 'pass',
      odometer: { value: 8541, unit: 'MI', resultType: 'READ' },
      defects: [{ type: 'ADVISORY', text: 'Tyre worn' }],
    },
  ],
  coverage: { motRecordCount: 1, message: '1 MOT test returned' },
  official: {
    testData: false,
    retrievedAt: '2026-11-21T12:00:00Z',
    sources: { dvla: 'available', dvsa: 'available' },
    motSource: 'DVLA',
    notes: [],
  },
};
const provenance = {
  FinanceDetails: { FinanceRecordList: [] },
  MiaftrDetails: { WriteOffRecordList: [] },
  PncDetails: { IsStolen: false },
};
test('completion requests exactly three packages without a paid preview and retains official evidence', async () => {
  const calls: string[] = [];
  const report = await generateSandboxReport('YJ22ACU', preview, {
    apiKey: 'key',
    fetcher: async (input, init) => {
      expect(init?.redirect).toBe('error');
      const name = new URL(String(input)).searchParams.get('packagename')!;
      calls.push(name);
      return Response.json({ Results: name === 'VDICheck' ? provenance : {} });
    },
  });
  expect(calls[0]).toBe('VDICheck');
  expect(calls.sort()).toEqual(['TyreDetails', 'VDICheck', 'ValuationDetails']);
  expect(report.vehicle.name).toBe('LOTUS EXIGE');
  expect(report.vehicle.mileage).toBe(8541);
  expect(report.detail?.registered).toBe('2022-05');
  expect(report.detail?.engine).toContain('PETROL');
  expect(report.evidence?.mot[0]?.annotations?.[0]?.text).toBe('Tyre worn');
  expect(report.tax?.status).toBe('taxed');
  expect(report.officialPreview?.vehicle.firstRegistered).toBe('2022-05');
  expect(report.testReport).toBe(true);
  expect(report.checks.every((check) => check.status === 'none-returned')).toBe(true);
});
test('required package failure stops optional calls and never fabricates a report', async () => {
  let calls = 0;
  await expect(
    generateSandboxReport('YJ22ACU', preview, {
      apiKey: 'key',
      fetcher: async () => {
        calls++;
        return new Response('private', { status: 503 });
      },
    }),
  ).rejects.toThrow('unavailable');
  expect(calls).toBe(1);
});
test('sandbox restriction and preview identity are checked before spending', async () => {
  let calls = 0;
  const options = {
    apiKey: 'key',
    fetcher: async () => {
      calls++;
      return Response.json({ Results: provenance });
    },
  };
  await expect(
    generateSandboxReport('XX12XYZ', { ...preview, registration: 'XX12XYZ' }, options),
  ).rejects.toThrow('letter A');
  await expect(
    generateSandboxReport('YJ22ACU', { ...preview, registration: 'OTHER' }, options),
  ).rejects.toThrow('match');
  expect(calls).toBe(0);
});
test('VDG identity mismatch stops enrichment', async () => {
  let calls = 0;
  await expect(
    generateSandboxReport('YJ22ACU', preview, {
      apiKey: 'key',
      fetcher: async () => {
        calls++;
        return Response.json({
          Results: {
            ...provenance,
            VehicleDetails: { VehicleIdentification: { Vrm: 'OTHER', DvlaMake: 'FORD' } },
          },
        });
      },
    }),
  ).rejects.toThrow('identity');
  expect(calls).toBe(1);
});
test('optional package failure leaves visible gaps without removing official history', async () => {
  const report = await generateSandboxReport('YJ22ACU', preview, {
    apiKey: 'key',
    fetcher: async (input) =>
      new URL(String(input)).searchParams.get('packagename') === 'VDICheck'
        ? Response.json({ Results: provenance })
        : new Response('private', { status: 503 }),
  });
  expect(report.evidence?.notes.join(' ')).toContain('ValuationDetails unavailable');
  expect(report.evidence?.notes.join(' ')).toContain('TyreDetails unavailable');
  expect(report.evidence?.mot).toHaveLength(1);
});
test('missing and malformed provenance is not described as clear', async () => {
  for (const data of [
    {},
    {
      FinanceDetails: { FinanceRecordList: [null] },
      MiaftrDetails: { WriteOffRecordList: 'bad' },
      PncDetails: { IsStolen: 'false' },
    },
  ]) {
    const report = await generateSandboxReport('YJ22ACU', preview, {
      apiKey: 'key',
      fetcher: async () => Response.json({ Results: data }),
    });
    expect(report.checks.every((check) => check.status === 'not-checked')).toBe(true);
    expect(report.findings.map((item) => item.label).join(' ')).not.toContain('No headline issue');
  }
});

test('a same-make different model is rejected before optional spending, but trim enrichment is allowed', async () => {
  let calls = 0;
  const options = {
    apiKey: 'key',
    fetcher: async () => {
      calls++;
      return Response.json({
        Results: {
          ...provenance,
          ModelDetails: { ModelIdentification: { Make: 'LOTUS', Model: 'ELISE' } },
        },
      });
    },
  };
  await expect(generateSandboxReport('YJ22ACU', preview, options)).rejects.toThrow('identity');
  expect(calls).toBe(1);
  const report = await generateSandboxReport('YJ22ACU', preview, {
    apiKey: 'key',
    fetcher: async () =>
      Response.json({
        Results: {
          ...provenance,
          ModelDetails: { ModelIdentification: { Make: 'LOTUS', Model: 'EXIGE SPORT 410' } },
        },
      }),
  });
  expect(report.vehicle.name.toUpperCase()).toContain('EXIGE');
});
test('a sole positive stolen record cannot coexist with a no-headline-issue finding', async () => {
  const report = await generateSandboxReport('YJ22ACU', preview, {
    apiKey: 'key',
    fetcher: async () =>
      Response.json({ Results: { ...provenance, PncDetails: { IsStolen: true } } }),
  });
  expect(report.checks.find((check) => check.name === 'Stolen status')?.status).toBe(
    'record-returned',
  );
  expect(report.findings.map((finding) => finding.label).join(' ')).not.toContain(
    'No headline issue',
  );
  expect(
    report.findings
      .map((finding) => finding.label)
      .join(' ')
      .toLowerCase(),
  ).toContain('stolen');
});
test('DVLA lookup date and VDG tax-rate generation date remain distinct', async () => {
  const report = await generateSandboxReport('YJ22ACU', preview, {
    apiKey: 'key',
    fetcher: async () =>
      Response.json({
        Results: {
          ...provenance,
          VehicleTaxDetails: {
            GeneratedAt: '2025-10-01',
            TaxStatus: 'SORN',
            VehicleExciseDutyDetails: { VedRate: { Standard: { TwelveMonths: 200 } } },
          },
        },
      }),
  });
  expect(report.tax?.status).toBe('taxed');
  expect(report.tax?.date).toBe('2025-10-01');
  expect(report.tax?.officialLookupDate).toBe('2026-11-21');
});
