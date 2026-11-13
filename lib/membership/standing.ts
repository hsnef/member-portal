/**
 * A member's standing on a given day, from their level and membership rows
 * (memberships: level, status, year, start_date, end_date). Shown when staff
 * scan a pass, and used by the daily expiry. Safe in the browser.
 *
 * The membership year (temple brief §2.2): Annual runs to Dec 31 of its year;
 * not renewed -> back to Community. Lifetime never expires.
 */

import type { MembershipLevel } from '@/types/database'

export interface MembershipRow {
  level: MembershipLevel
  status: string
  start_date: string
  end_date: string | null
}

export type Standing =
  | { state: 'lifetime'; label: string }
  | { state: 'active'; label: string; validTo: string }
  | { state: 'expired'; label: string; expiredOn: string }
  | { state: 'no_dates'; label: string }
  | { state: 'community'; label: string }

const long = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

/** `today` is a YYYY-MM-DD date in the temple's time zone. */
export function standing(level: MembershipLevel, rows: MembershipRow[], today: string): Standing {
  if (level === 'Lifetime') return { state: 'lifetime', label: 'Lifetime member, no expiry' }

  const annual = rows.filter((r) => r.level === 'Annual' && r.status !== 'Cancelled' && r.end_date)
  const current = annual
    .filter((r) => r.start_date <= today && (r.end_date as string) >= today)
    .sort((a, b) => (b.end_date as string).localeCompare(a.end_date as string))[0]
  // A renewal paid early may start later than today; the member is covered
  // through the last end date of any membership that has begun or is next.
  const furthest = annual.filter((r) => (r.end_date as string) >= today).sort((a, b) => (b.end_date as string).localeCompare(a.end_date as string))[0]

  if (level === 'Annual') {
    if (current || furthest) {
      const to = (furthest ?? current).end_date as string
      return { state: 'active', label: `Annual member, valid to ${long(to)}`, validTo: to }
    }
    const last = annual.sort((a, b) => (b.end_date as string).localeCompare(a.end_date as string))[0]
    if (last) return { state: 'expired', label: `Annual membership ended ${long(last.end_date as string)}`, expiredOn: last.end_date as string }
    // Imported Annual members whose dates were not part of the import.
    return { state: 'no_dates', label: 'Annual member (no membership dates on record)' }
  }

  const last = annual.sort((a, b) => (b.end_date as string).localeCompare(a.end_date as string))[0]
  if (last && (last.end_date as string) < today) {
    return { state: 'community', label: `Community member (Annual ended ${long(last.end_date as string)})` }
  }
  return { state: 'community', label: 'Community member' }
}

/** Today in the temple's time zone, as YYYY-MM-DD. */
export function templeToday(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}
