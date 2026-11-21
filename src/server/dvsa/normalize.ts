import { AppError } from '../errors';
import { asRecord, readDate, readString } from '../provider/guards';

export type DvsaMotTest = {
  completedDate: string;
  expiryDate?: string;
  result: 'pass' | 'fail' | 'unknown';
  odometer: { value: number | null; unit?: string; resultType?: string };
  defects?: { type?: string; text: string; dangerous?: boolean }[];
};

export type DvsaVehicle = {
  registration: string;
  make: string;
  model?: string;
  firstUsedDate?: string;
  registrationDate?: string;
  manufactureDate?: string;
  primaryColour?: string;
  secondaryColour?: string;
  fuelType?: string;
  engineCapacityCc?: number;
  motTests?: DvsaMotTest[];
};

function invalid(): never {
  throw new Error('DVSA returned an invalid vehicle response.');
}

function integer(value: unknown): number | undefined {
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) value = Number(value);
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function date(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return invalid();
  return readDate(value) ?? invalid();
}

export function motTimestamp(value: string): number {
  const normalized = value.replace(' ', 'T');
  // Compare offset-free service timestamps consistently, independent of the host timezone.
  return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(normalized) ? normalized : `${normalized}Z`);
}

function normalizeTest(value: unknown): DvsaMotTest {
  const test = asRecord(value);
  if (!test) return invalid();
  const completedDate = readString(test, 'completedDate');
  const testResult = readString(test, 'testResult');
  if (!completedDate || !readDate(completedDate) || !testResult) return invalid();
  if (
    !/^\d{4}-\d{2}-\d{2}[T ](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/.test(
      completedDate,
    ) ||
    !Number.isFinite(motTimestamp(completedDate))
  )
    return invalid();
  const annotationSets = [test.defects, test.rfrAndComments].filter(
    (value) => value !== undefined && value !== null,
  );
  const annotations = annotationSets.length
    ? annotationSets.flatMap((value) => (Array.isArray(value) ? value : invalid()))
    : undefined;
  const defects = annotations?.map((value: unknown) => {
    const annotation = asRecord(value);
    const text = readString(annotation, 'text');
    if (!annotation || !text) return invalid();
    return {
      type: readString(annotation, 'type'),
      text,
      dangerous: typeof annotation.dangerous === 'boolean' ? annotation.dangerous : undefined,
    };
  });
  const resultType = readString(test, 'odometerResultType');
  return {
    completedDate,
    expiryDate: date(test.expiryDate),
    result: testResult === 'PASSED' ? 'pass' : testResult === 'FAILED' ? 'fail' : 'unknown',
    odometer: {
      value: resultType === 'READ' ? (integer(test.odometerValue) ?? null) : null,
      unit: readString(test, 'odometerUnit'),
      resultType,
    },
    defects: defects
      ? [...new Map(defects.map((item) => [JSON.stringify(item), item])).values()]
      : undefined,
  };
}

export function normalizeDvsaVehicle(value: unknown, expectedRegistration: string): DvsaVehicle {
  const vehicle = asRecord(value);
  const registration = readString(vehicle, 'registration');
  const make = readString(vehicle, 'make');
  if (registration && registration !== expectedRegistration)
    throw new AppError(
      'IDENTITY_MISMATCH',
      502,
      'DVSA vehicle identity did not match the requested registration.',
    );
  if (!vehicle || registration !== expectedRegistration || !make) return invalid();
  if (vehicle.motTests !== undefined && !Array.isArray(vehicle.motTests)) return invalid();
  return {
    registration,
    make,
    model: readString(vehicle, 'model'),
    firstUsedDate: date(vehicle.firstUsedDate),
    registrationDate: date(vehicle.registrationDate),
    manufactureDate: date(vehicle.manufactureDate),
    primaryColour: readString(vehicle, 'primaryColour'),
    secondaryColour: readString(vehicle, 'secondaryColour'),
    fuelType: readString(vehicle, 'fuelType'),
    engineCapacityCc: integer(vehicle.engineSize),
    motTests: vehicle.motTests?.map(normalizeTest),
  };
}
