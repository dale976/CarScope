import { formatUkDate } from './date';
import type { VehicleDetail, MotRecord, HistoryEvent } from './report';
export function reportAnchor(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
export function dateLabel(value: string) {
  return formatUkDate(value) ?? 'Date unavailable';
}
export function motTitle(m: MotRecord) {
  return m.result === 'pass'
    ? 'MOT passed'
    : m.result === 'fail'
      ? 'MOT failed'
      : 'MOT result unavailable';
}
export function motText(m: MotRecord) {
  return `${m.mileage == null ? 'Mileage unavailable' : `${m.mileage.toLocaleString('en-GB')} miles`}. ${m.annotations === undefined ? 'Test findings unavailable.' : m.annotations.length ? m.annotations.map((a) => `${a.type}: ${a.text}`).join(' · ') : 'No advisories or defects recorded in this supplied test.'}${m.expiry ? ` Expiry in this record: ${dateLabel(m.expiry)}.` : ''}`;
}
export function buildTimeline(
  detail: VehicleDetail,
  mot: MotRecord[],
  events: HistoryEvent[] = [],
): HistoryEvent[] {
  return [
    {
      date: detail.registered,
      title: 'First registered',
      text: 'UK registration date in the supplied record.',
    },
    ...detail.keepers.map((k) => ({
      date: k.date,
      title: 'Registered keeper change',
      text: `${k.previous} previous ${k.previous === 1 ? 'keeper' : 'keepers'} recorded at this point.`,
    })),
    ...mot.map((m) => ({
      date: m.date,
      title: motTitle(m),
      text: motText(m),
      result: m.result,
      annotationCount: m.annotations?.length ?? 0,
      mot: m,
    })),
    ...events,
  ].sort((a, b) => a.date.localeCompare(b.date));
}
export function mileageReadings(mot: MotRecord[], recent = false) {
  const valid = mot
    .filter(
      (m) =>
        m.mileage !== null &&
        Number.isFinite(m.mileage) &&
        m.mileage >= 0 &&
        Number.isFinite(Date.parse(m.date)),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!recent || !valid.length) return valid;
  const cutoff = new Date(valid[valid.length - 1]?.date);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 5);
  return valid.filter((m) => Date.parse(m.date) >= cutoff.getTime());
}
