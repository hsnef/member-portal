import { describe, expect, it } from 'vitest'

import { daysUntil, formatCurrency, formatDate, formatLongDate, formatMonthYear } from './format'

/** Today's local calendar date as the `YYYY-MM-DD` these helpers take. */
function localDateString(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

describe('formatCurrency', () => {
  it('drops cents by default', () => {
    // The default across all 37 call sites. Pinned because it is a money-display
    // decision, not an accident: totals render as round dollars.
    expect(formatCurrency(1234)).toBe('$1,234')
  })

  it('ROUNDS rather than truncates when cents are dropped', () => {
    // $1,234.56 shows as $1,235 -- a dollar more than was charged. Correct for a
    // summary column, wrong for a receipt, which is why `withCents` exists.
    expect(formatCurrency(1234.56)).toBe('$1,235')
    expect(formatCurrency(0.5)).toBe('$1')
  })

  it('keeps exact cents when asked', () => {
    expect(formatCurrency(1234.56, true)).toBe('$1,234.56')
    expect(formatCurrency(0.5, true)).toBe('$0.50')
  })

  it('groups thousands', () => {
    expect(formatCurrency(1_000_000)).toBe('$1,000,000')
  })

  it('renders zero and negatives', () => {
    // Negatives appear on refunds and adjustments.
    expect(formatCurrency(0)).toBe('$0')
    expect(formatCurrency(-25, true)).toBe('-$25.00')
  })
})

describe('formatDate', () => {
  // These helpers append `T00:00:00` before parsing, which is load-bearing:
  // `new Date('2026-03-01')` is parsed as UTC midnight and renders as Feb 28 in
  // any negative-offset timezone -- every date in the app off by one. Appending
  // the time forces local parsing. These assertions therefore hold in any
  // timezone, and that is the property being protected.
  it('does not shift the date backwards', () => {
    expect(formatDate('2026-03-01')).toBe('Mar 1, 2026')
  })

  it('handles a date that would cross a month boundary if parsed as UTC', () => {
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026')
  })

  it('handles leap day', () => {
    expect(formatDate('2028-02-29')).toBe('Feb 29, 2028')
  })
})

describe('formatLongDate', () => {
  it('spells out the weekday and month', () => {
    expect(formatLongDate('2026-03-01')).toBe('Sunday, March 1, 2026')
  })
})

describe('formatMonthYear', () => {
  it('drops the day', () => {
    expect(formatMonthYear('2026-03-01')).toBe('March 2026')
  })
})

describe('daysUntil', () => {
  // Compared against local midnight, so these hold regardless of when in the
  // day the suite runs -- the flake this style of helper usually produces.
  it('is 0 for today', () => {
    expect(daysUntil(localDateString(0))).toBe(0)
  })

  it('counts forward', () => {
    expect(daysUntil(localDateString(7))).toBe(7)
  })

  it('goes negative for a date already past', () => {
    // Renewal screens rely on this to say "expired 3 days ago".
    expect(daysUntil(localDateString(-3))).toBe(-3)
  })
})
