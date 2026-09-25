export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDuration(minutes: number): string {
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
  const day = /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T12:00:00Z`));
}
