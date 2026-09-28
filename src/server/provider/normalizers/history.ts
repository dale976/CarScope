import type { BuyingReport, MotRecord } from '../../../shared/report';
import type { SupplierRecord } from '../types';
import { boolean, child, day, records, text } from './common';

export function normaliseMot(vdi: SupplierRecord | undefined): MotRecord[] {
  const history = child(vdi, 'MotHistoryDetails');
  return records(history?.MotTestDetailsList).flatMap((test) => {
    const date = day(test.TestDate);
    if (!date) return [];
    const reading = text(test, 'OdometerReading');
    const unit = text(test, 'OdometerUnit');
    const passed = boolean(test, 'TestPassed');
    return [
      {
        date,
        mileage: unit === 'mi' && reading && /^\d+$/.test(reading) ? Number(reading) : null,
        expiry: day(test.ExpiryDate) ?? null,
        result: passed === undefined ? undefined : passed ? ('pass' as const) : ('fail' as const),
        annotations: records(test.AnnotationList).map((item) => ({
          type: text(item, 'Type') ?? 'NOTE',
          text: text(item, 'Text') ?? 'Details unavailable',
        })),
      },
    ];
  });
}

export function normaliseMotStatus(
  value: unknown,
  mot: MotRecord[],
  asOf: string | undefined,
): BuyingReport['motStatus'] {
  const latest = [...mot].sort((a, b) => b.date.localeCompare(a.date))[0];
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  const expiry = latest?.expiry ?? undefined;
  if (raw.includes('exempt')) return { status: 'exempt', source: 'supplier' };
  if (raw === 'valid' || raw.includes('mot valid'))
    return { status: 'valid', expiry, source: 'supplier' };
  if (raw && raw !== 'no details held by dvla' && raw !== 'no results returned')
    return { status: latest?.result === 'fail' ? 'failed' : 'expired', expiry, source: 'supplier' };
  if (!latest) return { status: 'unavailable', source: 'derived' };
  if (latest.result === 'fail') return { status: 'failed', source: 'derived' };
  if (latest.result === 'pass' && expiry) {
    const reference = asOf && Number.isFinite(Date.parse(asOf)) ? Date.parse(asOf) : Date.now();
    return {
      status: Date.parse(`${expiry}T23:59:59Z`) >= reference ? 'valid' : 'expired',
      expiry,
      source: 'derived',
    };
  }
  return { status: 'unavailable', source: 'derived' };
}
