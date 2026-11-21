const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function evidenceTimestamp(value: string): number {
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return Date.parse(`${value}-01T00:00:00Z`);
  const normalized = value.replace(' ', 'T');
  return Date.parse(
    normalized.includes('T') && !/(?:Z|[+-]\d{2}:\d{2})$/.test(normalized)
      ? `${normalized}Z`
      : normalized,
  );
}

export function formatEvidenceDate(value: string): string {
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value))
    return `${MONTHS[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`;
  return formatUkDate(value.replace(' ', 'T')) ?? 'Date unavailable';
}

export function formatUkDate(value: string): string | undefined {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return undefined;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
