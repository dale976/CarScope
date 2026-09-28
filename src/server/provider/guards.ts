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
  if (typeof value !== 'string') return undefined;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return undefined;
  return value.slice(0, 10);
}
