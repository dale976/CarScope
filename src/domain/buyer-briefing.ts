import { reportAnchor } from '../shared/history';
import type { BuyingReport } from '../shared/report';

// Conservative presentation heuristic, not a statutory MOT-data boundary.
const PRE_DIGITAL_HISTORY_HEURISTIC_YEAR = 2000;

export interface BuyerBriefing {
  summary: string;
  priority?: { eyebrow: string; title: string; text: string; href: string };
  questions: string[];
  limitation: string;
  disclosure: string;
}

export function buildBuyerBriefing(report: BuyingReport): BuyerBriefing {
  const mot = report.evidence?.mot ?? [];
  const motWithMileage = mot.filter((record) => record.mileage !== null).length;
  const financeReturned = report.checks.some(
    (check) => check.name === 'Finance' && check.status === 'record-returned',
  );
  const significant = (report.historyEvents ?? []).filter((event) => event.significant);
  const incomplete = report.checks.filter((check) => check.status === 'not-checked');
  const sparseOlderHistory =
    report.vehicle.year < PRE_DIGITAL_HISTORY_HEURISTIC_YEAR &&
    (mot.length === 0 || motWithMileage < mot.length);
  const priority = financeReturned
    ? {
        eyebrow: 'One item to resolve',
        title: 'Outstanding finance recorded',
        text: 'A finance agreement appears in the supplied records. Ask for evidence that the agreement will be settled before ownership transfers.',
        href: '#history-check-finance',
      }
    : significant[0]
      ? {
          eyebrow: 'One item to resolve',
          title: significant[0].title,
          text: 'A significant dated event appears in the supplied history and should be checked against current documents.',
          href: `#history-event-${reportAnchor(significant[0].title)}`,
        }
      : undefined;
  const summary = sparseOlderHistory
    ? `The available history is incomplete. This older vehicle has ${mot.length} supplied MOT ${mot.length === 1 ? 'record' : 'records'} and mileage was supplied for only ${motWithMileage} of ${mot.length} MOT records. Earlier paper records may exist outside the returned data.`
    : priority
      ? 'The supplied records identify an item that should be resolved before purchase. The detailed evidence remains available in the report below.'
      : mot.length === 0
        ? 'The returned history is limited. This can be expected for a newer vehicle, but missing records must not be treated as confirmation that no event occurred.'
        : 'The returned identity, status and history records provide a useful starting point for a viewing. Confirm them against the vehicle and its current documents.';
  const questions: string[] = [];
  if (financeReturned)
    questions.push(
      'Confirm when the recorded finance will be settled and request written evidence.',
    );
  if (sparseOlderHistory) questions.push('Request older MOT certificates and service invoices.');
  if (report.ev)
    questions.push(
      'Ask for a current battery-health assessment and evidence of the remaining battery warranty.',
    );
  if (mot.some((record) => (record.annotations?.length ?? 0) > 0))
    questions.push(
      'Ask whether the recorded MOT findings were repaired and request supporting invoices.',
    );
  for (const question of report.sellerQuestions) {
    const duplicatesFinance = financeReturned && /finance|settle/i.test(question);
    if (questions.length < 4 && !duplicatesFinance && !questions.includes(question))
      questions.push(question);
  }
  const limitation = report.ev
    ? 'Battery health is not measured by these records. Present mechanical, cosmetic and battery condition still require inspection.'
    : incomplete.length
      ? `${incomplete.map((check) => check.name).join(', ')} ${incomplete.length === 1 ? 'was' : 'were'} not checked. The report also cannot establish the vehicle’s present mechanical or cosmetic condition.`
      : 'The supplied records cannot establish the vehicle’s present mechanical or cosmetic condition, or confirm a complete maintenance history.';
  return {
    summary,
    priority,
    questions: questions.slice(0, 4),
    limitation,
    disclosure:
      'This briefing explains supplied records. It is not a vehicle rating, condition assessment or buying recommendation.',
  };
}
