import { describe, expect, it } from 'vitest'
import { standing, templeToday, type MembershipRow } from './standing'

const annual = (start: string, end: string, status = 'Active'): MembershipRow => ({ level: 'Annual', status, start_date: start, end_date: end })
const TODAY = '2026-11-12'

describe('standing on a given day', () => {
  it('Lifetime never expires', () => {
    expect(standing('Lifetime', [], TODAY)).toEqual({ state: 'lifetime', label: 'Lifetime member, no expiry' })
  })

  it('Annual shows how long it is valid, through an early renewal for next year', () => {
    expect(standing('Annual', [annual('2026-03-01', '2026-12-31')], TODAY)).toMatchObject({
      state: 'active',
      validTo: '2026-12-31',
      label: 'Annual member, valid to December 31, 2026',
    })
    // Paid after Oct 1 for next year: covered now and through 2027.
    expect(standing('Annual', [annual('2026-03-01', '2026-12-31'), annual('2026-10-15', '2027-12-31')], TODAY)).toMatchObject({
      validTo: '2027-12-31',
    })
  })

  it('an Annual member whose last membership ended is shown as ended, not active', () => {
    expect(standing('Annual', [annual('2025-01-05', '2025-12-31', 'Expired')], TODAY)).toMatchObject({
      state: 'expired',
      label: 'Annual membership ended December 31, 2025',
    })
  })

  it('an imported Annual member without dates says so instead of guessing', () => {
    expect(standing('Annual', [], TODAY).state).toBe('no_dates')
  })

  it('a Community member who used to be Annual says when it ended', () => {
    expect(standing('Community', [annual('2025-01-05', '2025-12-31', 'Expired')], TODAY).label).toBe(
      'Community member (Annual ended December 31, 2025)',
    )
    expect(standing('Community', [], TODAY).label).toBe('Community member')
  })

  it('today is the temple’s date, not UTC’s', () => {
    // 01:30 UTC on Jan 1 is still Dec 31 in Jacksonville.
    expect(templeToday(new Date('2027-01-01T01:30:00Z'))).toBe('2026-12-31')
  })
})
