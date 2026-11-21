import { AppError } from '../errors';
import { asRecord } from '../provider/guards';

export type DvlaVehicle = {
  registration: string;
  make: string;
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiry?: string;
  yearOfManufacture?: number;
  firstRegistered?: string;
  engineCapacity?: number;
  co2Emissions?: number;
  fuelType?: string;
  colour?: string;
  euroStatus?: string;
  typeApproval?: string;
  wheelplan?: string;
  markedForExport?: boolean;
  markedAsScrapped?: boolean;
  dateOfLastV5CIssued?: string;
  revenueWeight?: number;
};

export function invalidDvla(): never {
  throw new AppError('DVLA_INVALID', 502, 'DVLA returned invalid vehicle data.');
}
export function calendarDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function normalizeDvlaVehicle(value: unknown, expected: string): DvlaVehicle {
  const raw = asRecord(value);
  if (
    !raw ||
    raw.registrationNumber !== expected ||
    typeof raw.make !== 'string' ||
    !raw.make.trim()
  ) {
    if (raw && typeof raw.registrationNumber === 'string' && raw.registrationNumber !== expected)
      throw new AppError(
        'IDENTITY_MISMATCH',
        502,
        'Vehicle identity did not match the requested registration.',
      );
    return invalidDvla();
  }
  const string = (key: string): string | undefined => {
    const v = raw[key];
    if (v === undefined || v === null) return undefined;
    if (typeof v !== 'string' || !v.trim()) return invalidDvla();
    return v.trim();
  };
  const number = (key: string): number | undefined => {
    const v = raw[key];
    if (v === undefined || v === null) return undefined;
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) return invalidDvla();
    return v;
  };
  const boolean = (key: string): boolean | undefined => {
    const v = raw[key];
    if (v === undefined || v === null) return undefined;
    return typeof v === 'boolean' ? v : invalidDvla();
  };
  const date = (key: string) => {
    const v = string(key);
    return v === undefined || calendarDate(v) ? v : invalidDvla();
  };
  const alias = (a: string | undefined, b: string | undefined) => {
    if (a !== undefined && b !== undefined && a !== b) return invalidDvla();
    return a ?? b;
  };
  let firstRegistered: string | undefined;
  const month = raw.monthOfFirstRegistration;
  if (typeof month === 'string') {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return invalidDvla();
    firstRegistered = month;
  } else if (month !== undefined && month !== null) {
    const year = number('yearOfFirstRegistration');
    if (
      typeof month !== 'number' ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !year ||
      year < 1800 ||
      year > 9999
    )
      return invalidDvla();
    firstRegistered = `${year}-${String(month).padStart(2, '0')}`;
  }
  const year = number('yearOfManufacture');
  if (year !== undefined && (year < 1800 || year > 9999)) return invalidDvla();
  return {
    registration: expected,
    make: raw.make.trim(),
    taxStatus: string('taxStatus'),
    taxDueDate: date('taxDueDate'),
    motStatus: string('motStatus'),
    motExpiry: alias(date('motExpiryDate'), date('motExpiry')),
    yearOfManufacture: year,
    firstRegistered,
    engineCapacity: number('engineCapacity'),
    co2Emissions: number('co2Emissions'),
    fuelType: string('fuelType'),
    colour: string('colour'),
    euroStatus: string('euroStatus'),
    typeApproval: string('typeApproval'),
    wheelplan: alias(string('wheelplan'), string('wheelPlan')),
    markedForExport: boolean('markedForExport'),
    markedAsScrapped: boolean('markedAsScrapped'),
    dateOfLastV5CIssued: date('dateOfLastV5CIssued'),
    revenueWeight: number('revenueWeight'),
  };
}
