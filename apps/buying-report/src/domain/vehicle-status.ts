import { statusCopy, type VehiclePreview } from '../shared/preview';
import type { BuyingReport } from '../shared/report';

type MotStatus = NonNullable<VehiclePreview['mot']>;
type TaxStatus = NonNullable<VehiclePreview['tax']>;

export type VehicleStatusDisplay = {
  label: string;
  detail: string;
  tone: string;
};

export function buildMotDisplay(status: MotStatus | undefined): VehicleStatusDisplay {
  const label = status
    ? {
        valid: 'MOT valid',
        expired: 'MOT expired',
        failed: 'Latest MOT failed',
        exempt: 'MOT exempt',
        unavailable: 'MOT status unavailable',
        'not-yet-due': 'First MOT not yet due',
      }[status.status]
    : 'MOT status unavailable';
  return {
    label,
    detail: status ? statusCopy(status) : 'Status not established',
    tone: status?.status ?? 'unavailable',
  };
}

export function buildTaxDisplay(
  status:
    | TaxStatus
    | (Pick<NonNullable<BuyingReport['tax']>, 'status' | 'dueDate' | 'date'> & {
        sourceDate?: string;
      })
    | undefined,
): VehicleStatusDisplay {
  const value = status?.status ?? 'unavailable';
  const sourceDate =
    status && 'sourceDate' in status
      ? status.sourceDate
      : status && 'date' in status
        ? status.date
        : undefined;
  return {
    label: {
      taxed: 'Taxed',
      untaxed: 'Untaxed',
      sorn: 'SORN',
      exempt: 'Tax exempt',
      unavailable: 'Tax status unavailable',
    }[value],
    detail: status
      ? statusCopy({ status: value, dueDate: status.dueDate, sourceDate })
      : 'Status not established',
    tone: value,
  };
}
