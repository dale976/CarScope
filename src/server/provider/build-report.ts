import type { BuyingReport } from '../../shared/report';
import type { SupplierRecord } from './types';
import { normaliseEv } from './normalizers/ev';
import { normaliseMot } from './normalizers/history';
import { normaliseProvenance } from './normalizers/provenance';
import { normaliseTyres } from './normalizers/tyres';
import { normaliseValuation } from './normalizers/valuation';
import { normaliseVehicle } from './normalizers/vehicle';

export function buildReport(
  registration: string,
  details: SupplierRecord,
  vdi: SupplierRecord | undefined,
  valuation: SupplierRecord | undefined,
  tyreDetails: SupplierRecord | undefined,
  missing: string[],
  provenanceChecked = vdi !== undefined,
): BuyingReport {
  const mot = normaliseMot(vdi);
  const normalisedVehicle = normaliseVehicle(details, vdi, mot);
  const provenance = normaliseProvenance(vdi);
  const tyres = normaliseTyres(tyreDetails);
  const valuationEvidence = normaliseValuation(valuation);
  const ev = normaliseEv(normalisedVehicle.powertrain);
  const failed = mot.filter((item) => item.result === 'fail');
  const dangerous = mot.flatMap((item) =>
    (item.annotations ?? [])
      .filter((annotation) => annotation.type === 'DANGEROUS')
      .map((annotation) => ({ ...annotation, date: item.date })),
  );
  const financeReturned = provenance.financeRecords.length > 0;
  const writeOffReturned = provenance.writeOffRecordReturned;
  const evidenceNotes = [...missing];
  if (tyreDetails && tyres.length === 0)
    evidenceNotes.push('TyreDetails returned no usable fitment for this report.');

  return {
    registration,
    financeRecords: provenance.financeRecords,
    ev,
    kind: 'sandbox-example',
    vehicle: normalisedVehicle.vehicle,
    detail: normalisedVehicle.detail,
    historyEvents: provenance.writeOffEvents,
    motStatus: normalisedVehicle.motStatus,
    tax: normalisedVehicle.tax,
    findings: [
      ...(financeReturned
        ? [
            {
              label: 'A finance record needs follow-up',
              text: 'One or more finance records were returned. Confirm the current position and obtain evidence of settlement before purchase.',
              source: 'not-checked' as const,
            },
          ]
        : []),
      ...(writeOffReturned
        ? [
            {
              label: 'An insurance write-off record was returned',
              text: 'Review the category, repair evidence and present condition with an independent inspector.',
              source: 'not-checked' as const,
            },
          ]
        : []),
      ...(failed.length
        ? [
            {
              label: `${failed.length} failed MOT ${failed.length === 1 ? 'test was' : 'tests were'} returned`,
              text: 'Review each failure with its later retest or repair evidence. A later pass does not erase the earlier finding.',
              source: 'not-checked' as const,
            },
          ]
        : []),
      ...(dangerous.length
        ? [
            {
              label: 'Dangerous MOT defects appear in the history',
              text: 'These findings are historical. Confirm the repairs and inspect the vehicle’s current condition.',
              source: 'not-checked' as const,
            },
          ]
        : []),
      ...(!financeReturned && !writeOffReturned && !failed.length
        ? [
            {
              label: 'No headline issue was identified in the supplied records',
              text: 'Review the complete report and obtain current checks before relying on this result.',
              source: 'not-checked' as const,
            },
          ]
        : []),
    ].slice(0, 3),
    checks: [
      {
        name: 'Finance',
        status: provenanceChecked
          ? financeReturned
            ? 'record-returned'
            : 'none-returned'
          : 'not-checked',
      },
      {
        name: 'Stolen status',
        status: provenanceChecked
          ? provenance.stolen
            ? 'record-returned'
            : 'none-returned'
          : 'not-checked',
      },
      {
        name: 'Insurance write-off',
        status: provenanceChecked
          ? writeOffReturned
            ? 'record-returned'
            : 'none-returned'
          : 'not-checked',
      },
    ],
    costs: [],
    sellerQuestions: [
      'Can I see the complete service history and supporting invoices?',
      'Can I arrange an independent inspection before paying a deposit?',
      ...(financeReturned
        ? ['Can you provide the current finance status and evidence of settlement?']
        : []),
      ...(writeOffReturned
        ? ['Can I see the write-off repair photographs, invoices and inspection report?']
        : []),
      ...(failed.length ? ['What repairs followed the recorded MOT failures?'] : []),
    ],
    historyNote:
      'This report reflects the records returned by the supplier. It is not a current vehicle clearance and gaps do not establish that no events occurred.',
    missingData:
      'Equipment, insurance, servicing and replacement costs are not included unless explicitly shown.',
    evidence: {
      mot,
      valuation: valuationEvidence,
      tyres,
      notes: [
        'Supplier data may be up to 12 months out of date.',
        'No raw provider response was retained.',
        ...evidenceNotes,
      ],
    },
  };
}
