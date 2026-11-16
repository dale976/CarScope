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
  return readDate(value) ?? invalid();
}

function normalizeTest(value: unknown): DvsaMotTest {
  const test = asRecord(value);
  if (!test) return invalid();
  const completedDate = readString(test, 'completedDate');
  const testResult = readString(test, 'testResult');
  if (!completedDate || !readDate(completedDate) || !testResult) return invalid();
  if (!Number.isFinite(Date.parse(completedDate.replace(' ', 'T')))) return invalid();
  const annotations = test.defects ?? test.rfrAndComments;
  if (annotations !== undefined && !Array.isArray(annotations)) return invalid();
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
    defects,
  };
}

export function normalizeDvsaVehicle(value: unknown, expectedRegistration: string): DvsaVehicle {
  const vehicle = asRecord(value);
  const registration = readString(vehicle, 'registration');
  const make = readString(vehicle, 'make');
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
