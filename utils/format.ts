export function formatCurrency(amount: number, withCents = false): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0
  }).format(amount);
}

/**
 * A plain date ("2026-12-05") is a calendar day: read it as local midnight, or
 * a UTC parse would shift it a day west of Greenwich. Anything longer is a
 * timestamp ("2026-11-11T14:26:19.34+00:00", e.g. created_at) and is parsed
 * as is. Appending "T00:00:00" to a timestamp made "Invalid Date" on every
 * page that formatted created_at (found 2026-11-11).
 */
function toDate(iso: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
}

export function formatDate(iso: string): string {
  return toDate(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatLongDate(iso: string): string {
  return toDate(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatMonthYear(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

export function daysUntil(iso: string): number {
  const target = new Date(`${iso}T00:00:00`).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}