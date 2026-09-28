export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return 'Unavailable';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return 'Unavailable';
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return (
    [hours ? `${hours} hr` : null, remaining ? `${remaining} min` : null]
      .filter(Boolean)
      .join(' ') || '0 min'
  );
}

export function formatRegistration(value: string): string {
  const clean = value.toUpperCase().replace(/\s/g, '');
  return clean.length === 7 ? `${clean.slice(0, 4)} ${clean.slice(4)}` : clean;
}

export function formatDate(value: string): string {
  return formatUkDate(value) ?? 'Unavailable';
}
import { formatUkDate } from '../shared/date';
