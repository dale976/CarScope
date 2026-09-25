import type { SupplierRecord } from './types';

export function asRecord(value: unknown): SupplierRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as SupplierRecord)
    : undefined;
}

export function asRecordList(value: unknown): SupplierRecord[] {
  return Array.isArray(value)
    ? value.flatMap((item) => (asRecord(item) ? [asRecord(item)!] : []))
    : [];
}

export function readString(record: SupplierRecord | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function readFiniteNumber(
  record: SupplierRecord | undefined,
  key: string,
): number | undefined {
  const value = record?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function readBoolean(record: SupplierRecord | undefined, key: string): boolean | undefined {
  const value = record?.[key];
  return typeof value === 'boolean' ? value : undefined;
}

export function readRecord(
  record: SupplierRecord | undefined,
  key: string,
): SupplierRecord | undefined {
  return asRecord(record?.[key]);
}

export function readDate(value: unknown): string | undefined {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : undefined;
}
