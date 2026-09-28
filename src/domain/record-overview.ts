import { reportAnchor } from '../shared/history';
import { resolvedMotStatus } from '../shared/preview';
import type { BuyingReport } from '../shared/report';
import { buildMotDisplay, buildTaxDisplay, type VehicleStatusDisplay } from './vehicle-status';

export interface RecordOverviewModel {
  mot: VehicleStatusDisplay;
  tax: VehicleStatusDisplay;
  stats: Array<{ value: number; label: string; tone: 'neutral' | 'attention' | 'pending' }>;
  attention: Array<{ label: string; detail: string; href: string }>;
  whyItMatters: string;
  nextStep: string;
  findings: Array<{ sourceLabel: string; label: string; text: string }>;
}

export function buildRecordOverview(report: BuyingReport): RecordOverviewModel {
  const finance = report.financeRecords?.[0];
  const significant = report.historyEvents?.filter((event) => event.significant).length ?? 0;
  const returned = report.checks.filter((check) => check.status === 'record-returned').length;
  const incomplete = report.checks.filter((check) => check.status === 'not-checked').length;
  const supplied =
    (report.evidence?.mot.length ?? 0) +
    (report.detail?.keepers.length ?? 0) +
    (report.historyEvents?.length ?? 0) +
    (report.financeRecords?.length ?? 0);
  const attention = [
    ...(report.historyEvents ?? [])
      .filter((event) => event.significant)
      .map((event) => ({
        label: event.title,
        detail: 'A significant dated event appears in the supplied history.',
        href: `#history-event-${reportAnchor(event.title)}`,
      })),
    ...report.checks
      .filter((check) => check.status === 'record-returned')
      .map((check) => ({
        label:
          check.name === 'Finance' ? 'Finance record returned' : `${check.name} · Record returned`,
        detail:
          check.name === 'Finance'
            ? [finance?.agreementType, finance?.company].filter(Boolean).join(' · ') ||
              'Confirm its current status and obtain evidence of settlement before purchase.'
            : 'Review the returned record and verify its current status before purchase.',
        href: `#history-check-${reportAnchor(check.name)}`,
      })),
  ];
  return {
    mot: buildMotDisplay(resolvedMotStatus(report)),
    tax: buildTaxDisplay(report.tax),
    stats: [
      {
        value: supplied,
        label: supplied === 1 ? 'record supplied' : 'records supplied',
        tone: 'neutral',
      },
      {
        value: returned,
        label: `${returned === 1 ? 'check returned a record' : 'checks returned records'}`,
        tone: returned ? 'attention' : 'neutral',
      },
      {
        value: incomplete,
        label: incomplete === 1 ? 'check not completed' : 'checks not completed',
        tone: incomplete ? 'pending' : 'neutral',
      },
    ],
    attention,
    whyItMatters:
      significant || returned
        ? 'The supplied records contain items that deserve a closer look before relying on the vehicle’s history.'
        : 'No headline event was identified in the supplied records, but that is not the same as a current all-clear.',
    nextStep: incomplete
      ? 'Complete the outstanding checks and verify any returned records with current documents or an independent inspection.'
      : 'Verify the returned information against current documents and the vehicle itself before purchase.',
    findings: report.findings.map((finding) => ({
      sourceLabel:
        finding.source === 'seller-claim'
          ? 'Seller claim'
          : finding.source === 'estimate'
            ? 'Illustrative estimate / supplier benchmark'
            : 'Supplied record',
      label: finding.label,
      text: finding.text,
    })),
  };
}
