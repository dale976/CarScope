import { formatUkDate } from './date';
import type { BuyingReport } from './report';

export type DataMode = 'mock' | 'live';
export type ClientRuntimeConfig = { sandboxControls: boolean };
export type VehiclePreview = {
  previewId: string;
  registration: string;
  source: DataMode;
  vehicle: {
    name: string;
    year: number | null;
    registered?: string;
    fuelType?: string;
    transmission?: string;
    colour?: string;
    image?: { url: string; expires?: string };
  };
  mot?: {
    status: 'valid' | 'expired' | 'failed' | 'exempt' | 'unavailable' | 'not-yet-due';
    expiry?: string;
    dueDate?: string;
    sourceDate?: string;
  };
  tax?: {
    status: 'taxed' | 'untaxed' | 'sorn' | 'exempt' | 'unavailable';
    dueDate?: string;
    sourceDate?: string;
  };
  coverage: { motRecordCount?: number; ukRecordStart?: string; message: string };
};

type StatusFact = { status: string; expiry?: string; dueDate?: string; sourceDate?: string };
const statusDate = (value: string) => {
  return formatUkDate(value) ?? 'Date unavailable';
};
export const displayDate = statusDate;
export function statusCopy(fact: StatusFact, options: { asOf?: string } = {}): string {
  if (fact.status === 'unavailable') return 'Status not established';
  if (fact.status === 'not-yet-due' && fact.dueDate)
    return `Usually due by ${statusDate(fact.dueDate)}`;
  const asOf = options.asOf ?? new Date().toISOString().slice(0, 10);
  const currentUntil = fact.expiry ?? fact.dueDate;
  if (currentUntil && currentUntil >= asOf) return `Current through ${statusDate(currentUntil)}`;
  if (fact.sourceDate) return `Supplier record dated ${statusDate(fact.sourceDate)}`;
  if (currentUntil) return `Recorded expiry ${statusDate(currentUntil)}`;
  return 'Status returned without a current date';
}

function firstMotDue(
  registered: string | undefined,
  asOf: string,
  motCount: number | undefined,
  motStatus: BuyingReport['motStatus'],
) {
  if (!registered || motCount !== 0 || (motStatus && motStatus.status !== 'unavailable'))
    return undefined;
  const parts = registered.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return undefined;
  const due = `${Number(parts[1]) + 3}-${parts[2]}-${parts[3]}`;
  return asOf < due ? due : undefined;
}

function motForPreview(report: BuyingReport, asOf: string): VehiclePreview['mot'] {
  const latest = [...(report.evidence?.mot ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (report.motStatus && report.motStatus.status !== 'unavailable')
    return {
      status: report.motStatus.status,
      expiry: report.motStatus.expiry,
      sourceDate: latest?.date,
    };
  if (latest?.result === 'fail')
    return { status: 'failed', expiry: latest.expiry ?? undefined, sourceDate: latest.date };
  if (latest?.result === 'pass' && latest.expiry)
    return {
      status: latest.expiry >= asOf ? 'valid' : 'expired',
      expiry: latest.expiry,
      sourceDate: latest.date,
    };
  if (report.motStatus) return { status: 'unavailable', sourceDate: latest?.date };
  return undefined;
}

export function resolvedMotStatus(
  report: BuyingReport,
  options: { asOf?: string } = {},
): VehiclePreview['mot'] {
  const asOf = options.asOf ?? new Date().toISOString().slice(0, 10);
  const firstDue = firstMotDue(
    report.detail?.registered,
    asOf,
    report.evidence?.mot.length,
    report.motStatus,
  );
  return firstDue ? { status: 'not-yet-due', dueDate: firstDue } : motForPreview(report, asOf);
}

export function coverageForReport(report: BuyingReport): VehiclePreview['coverage'] {
  const count = report.evidence?.mot.length;
  const registered = report.detail?.registered;
  const registrationYear = registered ? Number(registered.slice(0, 4)) : undefined;
  const imported =
    registrationYear !== undefined &&
    Number.isFinite(registrationYear) &&
    report.vehicle.year > 0 &&
    registrationYear - report.vehicle.year > 1;
  if (count === undefined) return { message: 'Detailed history is checked in the complete report' };
  if (count === 0) return { motRecordCount: 0, message: 'No MOT tests returned' };
  if (imported)
    return {
      motRecordCount: count,
      ukRecordStart: registered,
      message: `${count} MOT ${count === 1 ? 'test' : 'tests'} returned since UK registration in ${registrationYear}`,
    };
  return {
    motRecordCount: count,
    message: `${count} MOT ${count === 1 ? 'test' : 'tests'} returned`,
  };
}

function fuelType(report: BuyingReport) {
  const engine = report.detail?.engine;
  if (!engine) return undefined;
  for (const value of ['Electric', 'Petrol', 'Diesel', 'Hybrid', 'Hydrogen'])
    if (new RegExp(`\\b${value}\\b`, 'i').test(engine)) return value;
  return undefined;
}

export function projectReportPreview(
  report: BuyingReport,
  previewId: string,
  source: DataMode,
  options: { asOf?: string } = {},
): VehiclePreview {
  if (!report.registration) throw new Error('The report does not identify a registration.');
  const taxStatus = report.tax?.status ?? 'unavailable';
  const asOf = options.asOf ?? new Date().toISOString().slice(0, 10);
  const mot = resolvedMotStatus(report, { asOf });
  const firstMotDueDate = mot?.status === 'not-yet-due' ? mot.dueDate : undefined;
  const coverage = firstMotDueDate
    ? { motRecordCount: 0, message: 'No MOT tests expected before the first test is due' }
    : coverageForReport(report);
  return {
    previewId,
    registration: report.registration,
    source,
    vehicle: {
      name: report.vehicle.name,
      year: report.vehicle.year || null,
      registered: report.detail?.registered,
      fuelType: fuelType(report),
      transmission: report.detail?.transmission,
      colour: report.detail?.colour,
      image: report.detail?.image
        ? { url: report.detail.image.url, expires: report.detail.image.expires }
        : undefined,
    },
    mot,
    tax: report.tax
      ? { status: taxStatus, dueDate: report.tax.dueDate, sourceDate: report.tax.date }
      : undefined,
    coverage,
  };
}
