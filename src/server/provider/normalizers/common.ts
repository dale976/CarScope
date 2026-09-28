import {
  asRecord,
  asRecordList,
  readBoolean,
  readDate,
  readFiniteNumber,
  readRecord,
  readString,
} from '../guards';
import type { SupplierRecord } from '../types';

export const record = (value: unknown): SupplierRecord => asRecord(value) ?? {};
export const records = asRecordList;
export const child = readRecord;
export const text = readString;
export const number = readFiniteNumber;
export const boolean = readBoolean;
export const day = readDate;

export function title(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim()
    ? value
        .trim()
        .toLowerCase()
        .replace(/(^|\s)\S/g, (character) => character.toUpperCase())
    : undefined;
}

export function vehicleTitle(value: unknown): string | undefined {
  return title(value)?.replace(
    /\b(amg|gts?|gt3|gt4|rs|srt|nsx|rx-7|lfa|rc-f|m40i|[0-9]+d)\b/gi,
    (token) => token.toUpperCase(),
  );
}
