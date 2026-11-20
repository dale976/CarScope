import { expect, test } from 'bun:test';
import type { DvlaVehicle } from '../src/server/dvla/normalize';
import type { DvsaVehicle } from '../src/server/dvsa/normalize';
import { normalizeDvsaVehicle } from '../src/server/dvsa/normalize';
import { AppError } from '../src/server/errors';
import { createOfficialPreview } from '../src/server/official-preview';

const dvla: DvlaVehicle = {
  registration: 'YJ22ACU',
  make: 'LOTUS',
  colour: 'BLUE',
  fuelType: 'PETROL',
  yearOfManufacture: 2022,
  firstRegistered: '2022-05',
  taxStatus: 'Taxed',
  taxDueDate: '2027-06-01',
  motStatus: 'Valid',
  motExpiry: '2027-05-10',
  engineCapacity: 3456,
  co2Emissions: 230,
};
const dvsa: DvsaVehicle = {
  registration: 'YJ22ACU',
  make: 'LOTUS',
  model: 'EXIGE',
  motTests: [
    {
      completedDate: '2025-04-23T12:00:00',
      expiryDate: '2026-05-10',
      result: 'pass',
      odometer: { value: 3454, unit: 'mi', resultType: 'READ' },
    },
    {
      completedDate: '2026-04-24T12:00:00',
      expiryDate: '2027-05-10',
      result: 'pass',
      odometer: { value: 8541, unit: 'mi', resultType: 'READ' },
      defects: [{ type: 'ADVISORY', text: 'Tyre worn', dangerous: false }],
    },
  ],
};
const now = () => new Date('2026-11-20T12:00:00Z');
test('combined preview exposes dated official facts and full MOT evidence without a paid session', async () => {
  const preview = await createOfficialPreview({
    dvla: async () => dvla,
    dvsa: async () => dvsa,
    testData: false,
    now,
  })('YJ22ACU');
  expect(preview.vehicle.name).toBe('LOTUS EXIGE');
  expect(preview.vehicle.firstRegistered).toBe('2022-05');
  expect(preview.tax?.status).toBe('taxed');
  expect(preview.mot?.expiry).toBe('2027-05-10');
  expect(preview.recordedMileage).toEqual({ value: 8541, unit: 'mi', date: '2026-04-24T12:00:00' });
  expect(preview.motHistory?.[0]?.defects?.[0]?.text).toBe('Tyre worn');
  expect(preview.coverage.motRecordCount).toBe(2);
  expect(preview.previewId).toBe('');
  expect(preview.official?.retrievedAt).toBe('2026-11-20T12:00:00.000Z');
});
test('partial previews label source failures and UAT data without fabricating missing history', async () => {
  const preview = await createOfficialPreview({
    dvla: async () => dvla,
    dvsa: async () => {
      throw new Error('private upstream failure');
    },
    testData: true,
    now,
  })('YJ22ACU');
  expect(preview.official?.testData).toBe(true);
  expect(preview.official?.sources.dvsa).toBe('unavailable');
  expect(preview.coverage.motRecordCount).toBeUndefined();
  expect(preview.recordedMileage).toBeUndefined();
  expect(JSON.stringify(preview)).not.toContain('private upstream failure');
});
test('missing history and zero returned tests remain distinct', async () => {
  for (const [motTests, count] of [
    [undefined, undefined],
    [[], 0],
  ] as const) {
    const preview = await createOfficialPreview({
      dvsa: async () => ({ ...dvsa, motTests: motTests ? [...motTests] : undefined }),
      testData: false,
      now,
    })('YJ22ACU');
    expect(preview.coverage.motRecordCount).toBe(count);
    expect(preview.mot?.status).toBe('unavailable');
    expect(preview.tax?.status).toBe('unavailable');
  }
});
test('identity disagreement stops merging even if another source succeeded', async () => {
  for (const patch of [{ registration: 'OTHER' }, { make: 'FORD' }]) {
    await expect(
      createOfficialPreview({
        dvla: async () => dvla,
        dvsa: async () => ({ ...dvsa, ...patch }),
        testData: false,
        now,
      })('YJ22ACU'),
    ).rejects.toThrow('identity');
  }
});
test('both sources failing returns an error instead of an identified empty vehicle', async () => {
  await expect(createOfficialPreview({ testData: false, now })('YJ22ACU')).rejects.toThrow(
    'unavailable',
  );
});
test('zero odometer is usable but unread values and unknown units are never current mileage', async () => {
  const preview = await createOfficialPreview({
    dvsa: async () => ({
      ...dvsa,
      motTests: [
        {
          completedDate: '2026-01-01T10:00:00',
          result: 'pass',
          odometer: { value: 0, unit: 'km', resultType: 'READ' },
        },
        {
          completedDate: '2026-02-01T10:00:00',
          result: 'fail',
          odometer: { value: null, unit: 'mi', resultType: 'UNREADABLE' },
        },
      ],
    }),
    testData: false,
    now,
  })('YJ22ACU');
  expect(preview.recordedMileage).toEqual({ value: 0, unit: 'km', date: '2026-01-01T10:00:00' });
});
test('conflicting MOT expiry is visible and unknown statuses never imply a clear result', async () => {
  const preview = await createOfficialPreview({
    dvla: async () => ({ ...dvla, motExpiry: '2027-06-10', taxStatus: 'Unexpected' }),
    dvsa: async () => dvsa,
    testData: false,
    now,
  })('YJ22ACU');
  expect(preview.tax?.status).toBe('unavailable');
  expect(preview.official?.notes.join(' ')).toContain('differ');
});
test('DVLA not valid without an expiry never becomes an inferred expired certificate', async () => {
  const preview = await createOfficialPreview({
    dvla: async () => ({ ...dvla, motStatus: 'Not valid', motExpiry: undefined }),
    testData: false,
    now,
  })('YJ22ACU');
  expect(preview.mot?.status).toBe('not-valid');
});
test('a rejected DVSA identity response cannot be hidden by a successful DVLA lookup', async () => {
  await expect(
    createOfficialPreview({
      dvla: async () => dvla,
      dvsa: async () => normalizeDvsaVehicle({ registration: 'OTHER', make: 'LOTUS' }, 'YJ22ACU'),
      testData: false,
      now,
    })('YJ22ACU'),
  ).rejects.toThrow('identity');
});

test('uppercase DVSA units remain usable and preserve the source spelling', async () => {
  const preview = await createOfficialPreview({
    dvsa: async () => ({
      ...dvsa,
      motTests: [
        { ...dvsa.motTests![1]!, odometer: { value: 8541, unit: 'MI', resultType: 'READ' } },
      ],
    }),
    testData: false,
    now,
  })('YJ22ACU');
  expect(preview.recordedMileage?.unit).toBe('MI');
  expect(preview.recordedMileage?.value).toBe(8541);
});
test('same-day tests sort by actual timestamp rather than separator or offset spelling', async () => {
  const preview = await createOfficialPreview({
    dvsa: async () => ({
      ...dvsa,
      motTests: [
        {
          completedDate: '2026-04-24T09:00:00+01:00',
          result: 'pass',
          odometer: { value: 100, unit: 'MI', resultType: 'READ' },
        },
        {
          completedDate: '2026-04-24 10:00:00',
          result: 'fail',
          odometer: { value: 110, unit: 'MI', resultType: 'READ' },
        },
      ],
    }),
    testData: false,
    now,
  })('YJ22ACU');
  expect(preview.mot?.status).toBe('failed');
  expect(preview.recordedMileage?.value).toBe(110);
});
test('DVLA invalid status and a current DVSA pass are surfaced as disagreement', async () => {
  const preview = await createOfficialPreview({
    dvla: async () => ({ ...dvla, motStatus: 'Not valid' }),
    dvsa: async () => dvsa,
    testData: false,
    now,
  })('YJ22ACU');
  expect(preview.official?.notes.join(' ')).toContain('differ');
});
test('a failed UAT source does not label live-only returned evidence as test data', async () => {
  const preview = await createOfficialPreview({
    dvla: async () => {
      throw new AppError('DVLA_NOT_FOUND', 404, 'Vehicle not found');
    },
    dvsa: async () => dvsa,
    testData: true,
    now,
  })('YJ22ACU');
  expect(preview.official?.testData).toBe(false);
  expect(preview.official?.notes.join(' ')).not.toContain('predefined test data');
});
test('no successful source preserves actionable not-found and busy responses', async () => {
  for (const status of [404, 429]) {
    try {
      await createOfficialPreview({
        dvla: async () => {
          throw new AppError(
            status === 404 ? 'DVLA_NOT_FOUND' : 'DVLA_BUSY',
            status,
            status === 404 ? 'Vehicle not found' : 'DVLA busy',
          );
        },
        testData: false,
        now,
      })('YJ22ACU');
      throw new Error('Unexpected success');
    } catch (e) {
      expect((e as AppError).status).toBe(status);
    }
  }
});
