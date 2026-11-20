import type { SourceState, VehiclePreview } from '../shared/preview';
import type { DvlaVehicle } from './dvla/normalize';
import { type DvsaVehicle, motTimestamp } from './dvsa/normalize';
import { AppError } from './errors';

type Options = {
  dvla?: (registration: string) => Promise<DvlaVehicle>;
  dvsa?: (registration: string) => Promise<DvsaVehicle>;
  testData: boolean;
  now?: () => Date;
};
async function source<T>(
  lookup: ((registration: string) => Promise<T>) | undefined,
  registration: string,
): Promise<{ value?: T; state: SourceState }> {
  if (!lookup) return { state: 'unconfigured' };
  try {
    return { state: 'available', value: await lookup(registration) };
  } catch (error) {
    if (error instanceof AppError && error.code === 'IDENTITY_MISMATCH') throw error;
    const message = error instanceof Error ? error.message : '';
    const state: SourceState =
      error instanceof AppError && error.status === 429
        ? 'busy'
        : /not found/i.test(message)
          ? 'not-found'
          : /invalid vehicle/i.test(message)
            ? 'invalid'
            : 'unavailable';
    return { state };
  }
}
export function createOfficialPreview(options: Options) {
  return async (registration: string): Promise<VehiclePreview> => {
    const [dvlaResult, dvsaResult] = await Promise.all([
      source(options.dvla, registration),
      source(options.dvsa, registration),
    ]);
    const a = dvlaResult.value;
    const b = dvsaResult.value;
    if (
      (a && a.registration !== registration) ||
      (b && b.registration !== registration) ||
      (a && b && a.make.toUpperCase() !== b.make.toUpperCase())
    )
      throw new AppError(
        'IDENTITY_MISMATCH',
        502,
        'Vehicle identity differs between the requested registration and source records.',
      );
    if (!a && !b) {
      const activeStates = [dvlaResult.state, dvsaResult.state].filter(
        (state) => state !== 'unconfigured',
      );
      if (activeStates.length && activeStates.every((state) => state === 'not-found'))
        throw new AppError(
          'VEHICLE_NOT_FOUND',
          404,
          'Vehicle not found in the configured official records.',
        );
      if (activeStates.includes('busy'))
        throw new AppError(
          'OFFICIAL_BUSY',
          429,
          'Official vehicle records are busy. Please try again shortly.',
        );
      throw new AppError(
        'OFFICIAL_UNAVAILABLE',
        503,
        'Official vehicle records are unavailable. Please try again later.',
      );
    }
    const retrievedAt = (options.now?.() ?? new Date()).toISOString();
    const asOf = retrievedAt.slice(0, 10);
    const history = b?.motTests
      ? [...b.motTests].sort(
          (x, y) => motTimestamp(y.completedDate) - motTimestamp(x.completedDate),
        )
      : undefined;
    const latest = history?.[0];
    const latestReading = history?.find(
      (test) =>
        test.odometer.value !== null &&
        test.odometer.resultType === 'READ' &&
        ['mi', 'km'].includes(test.odometer.unit?.toLowerCase() ?? ''),
    );
    const notes: string[] = [];
    let mot: NonNullable<VehiclePreview['mot']> = { status: 'unavailable' };
    let motSource: 'DVLA' | 'DVSA' | undefined;
    const dvlaMot = a?.motStatus?.toLowerCase();
    if (dvlaMot === 'valid' && a?.motExpiry) {
      mot = { status: a.motExpiry >= asOf ? 'valid' : 'expired', expiry: a.motExpiry };
      motSource = 'DVLA';
    } else if (dvlaMot === 'not valid') {
      mot = {
        status: a?.motExpiry && a.motExpiry < asOf ? 'expired' : 'not-valid',
        expiry: a?.motExpiry,
      };
      motSource = 'DVLA';
    } else if (dvlaMot === 'exempt') {
      mot = { status: 'exempt' };
      motSource = 'DVLA';
    }
    if (mot.status === 'unavailable' && latest) {
      if (latest.result === 'fail')
        mot = { status: 'failed', sourceDate: latest.completedDate.slice(0, 10) };
      else if (latest.result === 'pass' && latest.expiryDate)
        mot = {
          status: latest.expiryDate >= asOf ? 'valid' : 'expired',
          expiry: latest.expiryDate,
          sourceDate: latest.completedDate.slice(0, 10),
        };
      if (mot.status !== 'unavailable') motSource = 'DVSA';
    }
    if (a?.motExpiry && latest?.expiryDate && a.motExpiry !== latest.expiryDate)
      notes.push(
        'DVLA and DVSA MOT expiry dates differ. Both records are shown; verify the discrepancy before relying on them.',
      );
    if (dvlaMot === 'valid' && latest?.result === 'fail')
      notes.push(
        'DVLA MOT status and the latest returned DVSA test differ. A later failed test does not by itself establish whether an earlier certificate is still valid.',
      );
    if (
      dvlaMot === 'not valid' &&
      latest?.result === 'pass' &&
      latest.expiryDate &&
      latest.expiryDate >= asOf
    )
      notes.push(
        'DVLA MOT status and the latest returned DVSA pass differ. Check both source records before relying on the status.',
      );
    const testData = options.testData && !!a;
    if (testData)
      notes.push(
        'DVLA UAT returns predefined test data for vehicle and tax details. DVSA supplies live MOT history where returned. This mixed-source combination is for development and must not be treated as a current vehicle report.',
      );
    if (!a) notes.push('DVLA details could not be checked. Tax status is not established.');
    if (!b) notes.push('DVSA MOT history could not be checked.');
    const taxMap: Record<string, NonNullable<VehiclePreview['tax']>['status']> = {
      taxed: 'taxed',
      untaxed: 'untaxed',
      sorn: 'sorn',
      'not taxed for on road use': 'untaxed',
      exempt: 'exempt',
    };
    const yearFromDvsa = b?.manufactureDate ? Number(b.manufactureDate.slice(0, 4)) : undefined;
    return {
      previewId: '',
      registration,
      source: 'official',
      vehicle: {
        name: [a?.make ?? b?.make, b?.model].filter(Boolean).join(' '),
        year: a?.yearOfManufacture ?? yearFromDvsa ?? null,
        firstRegistered: a?.firstRegistered ?? b?.registrationDate,
        colour: a?.colour ?? b?.primaryColour,
        fuelType: a?.fuelType ?? b?.fuelType,
        engineCapacity: a?.engineCapacity ?? b?.engineCapacityCc,
        co2Emissions: a?.co2Emissions,
        euroStatus: a?.euroStatus,
        typeApproval: a?.typeApproval,
        wheelplan: a?.wheelplan,
        markedForExport: a?.markedForExport,
        markedAsScrapped: a?.markedAsScrapped,
        dateOfLastV5CIssued: a?.dateOfLastV5CIssued,
        revenueWeight: a?.revenueWeight,
      },
      mot,
      tax: {
        status: taxMap[a?.taxStatus?.toLowerCase() ?? ''] ?? 'unavailable',
        dueDate: a?.taxDueDate,
      },
      motHistory: history,
      recordedMileage: latestReading
        ? {
            value: latestReading.odometer.value!,
            unit: latestReading.odometer.unit!,
            date: latestReading.completedDate,
          }
        : undefined,
      coverage: {
        motRecordCount: history?.length,
        message:
          history === undefined
            ? 'MOT history unavailable'
            : history.length === 0
              ? 'No MOT tests returned'
              : `${history.length} MOT ${history.length === 1 ? 'test' : 'tests'} returned`,
      },
      official: {
        testData,
        retrievedAt,
        sources: { dvla: dvlaResult.state, dvsa: dvsaResult.state },
        notes,
        motSource,
      },
    };
  };
}
