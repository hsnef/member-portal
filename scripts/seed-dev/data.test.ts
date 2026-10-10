import { describe, expect, it } from 'vitest'
import {
  ACCOUNTS, BOOKINGS, DEMO_BOOKING_PREFIX, DEMO_EMAIL_PATTERN, DEV_SUPABASE_URL, DONATIONS, EVENTS,
  MEMBERS, REGISTRATIONS, REQUESTS, addDays, assertDevTarget, membershipFor, paymentFields,
} from './data'

describe('assertDevTarget — the seed must never touch anything but dev-mp', () => {
  it('accepts the dev-mp URL, with or without a trailing slash', () => {
    expect(() => assertDevTarget(DEV_SUPABASE_URL)).not.toThrow()
    expect(() => assertDevTarget(`${DEV_SUPABASE_URL}/`)).not.toThrow()
  })

  it('refuses production', () => {
    expect(() => assertDevTarget('https://gapvsdrzavjaublwkqfm.supabase.co')).toThrow(/Refusing to run/)
  })

  it('refuses a missing value', () => {
    expect(() => assertDevTarget(undefined)).toThrow(/Refusing to run/)
    expect(() => assertDevTarget('')).toThrow(/Refusing to run/)
  })

  it('refuses lookalikes and malformed values', () => {
    expect(() => assertDevTarget(`${DEV_SUPABASE_URL}.evil.example`)).toThrow()
    expect(() => assertDevTarget(DEV_SUPABASE_URL.replace('https', 'http'))).toThrow()
    // The exact typo found in .env.local on 2026-10-09.
    expect(() => assertDevTarget(DEV_SUPABASE_URL.replace('https', 'ttps'))).toThrow()
  })
})

describe('demo identities', () => {
  it('every member and account address matches the reset pattern', () => {
    // The reset step finds old demo rows by this pattern; a non-matching
    // address would be orphaned and duplicated on the next run.
    for (const e of [...MEMBERS.map(m => m.email), ...ACCOUNTS.map(a => a.email)]) {
      expect(e).toMatch(DEMO_EMAIL_PATTERN)
    }
  })

  it('member keys and emails are unique', () => {
    expect(new Set(MEMBERS.map(m => m.key)).size).toBe(MEMBERS.length)
    expect(new Set(MEMBERS.map(m => m.email)).size).toBe(MEMBERS.length)
  })

  it('phones are fictional 555 numbers', () => {
    for (const m of MEMBERS) expect(m.phone).toMatch(/^904-555-01\d\d$/)
  })

  it('covers all four roles, one account each', () => {
    const primary = ACCOUNTS.map(a => a.roles.find(r => r !== 'Member') ?? 'Member').sort()
    expect(primary).toEqual(['Admin', 'Member', 'Office Manager', 'Office Staff'])
  })

  it('every account holds Member and is linked to a member record (CLAUDE.md: staff also hold Member)', () => {
    for (const a of ACCOUNTS) {
      expect(a.roles).toContain('Member')
      expect(MEMBERS.some(m => m.key === a.memberKey && m.email === a.email)).toBe(true)
    }
  })

  it('family rows satisfy the family_members CHECKs', () => {
    for (const m of MEMBERS) {
      const children = (m.family ?? []).filter(f => f.relationship === 'Child')
      for (const c of children) expect(c.childOrder).toBeGreaterThan(0)
      expect(new Set(children.map(c => c.childOrder)).size).toBe(children.length)
      for (const f of m.family ?? []) if (f.relationship !== 'Child') expect(f.childOrder).toBeUndefined()
    }
  })

  it('a business member names the business', () => {
    for (const m of MEMBERS.filter(x => x.business)) expect(m.business!.length).toBeGreaterThan(0)
  })
})

describe('membershipFor honours the memberships CHECKs', () => {
  const today = new Date(Date.UTC(2026, 9, 9))
  const base = { key: 'x', email: 'demo-x@example.com', first: 'A', last: 'B', memberSinceYear: 2015, phone: '904-555-0100', city: 'J' }

  it('Annual has a year and a calendar-year term', () => {
    const ms = membershipFor({ ...base, level: 'Annual', status: 'Active' }, today)
    expect(ms).toMatchObject({ year: 2026, start_date: '2026-01-01', end_date: '2026-12-31', amount: 101 })
  })

  it('an expired Annual sits in last year', () => {
    expect(membershipFor({ ...base, level: 'Annual', status: 'Expired' }, today)).toMatchObject({ year: 2025, status: 'Expired' })
  })

  it('Lifetime has no end date', () => {
    expect(membershipFor({ ...base, level: 'Lifetime', status: 'Active' }, today)).toMatchObject({ end_date: null, amount: 1008 })
  })

  it('Community is free', () => {
    expect(membershipFor({ ...base, level: 'Community', status: 'Active' }, today).amount).toBe(0)
  })
})

describe('paymentFields honours the payments CHECKs', () => {
  it('a Stripe payment carries a payment intent id', () => {
    expect(paymentFields('Stripe', 'abc', 10).stripe_payment_intent_id).toBe('pi_demo_abc')
  })

  it('other methods carry none', () => {
    expect(paymentFields('Cash', 'abc', 10).stripe_payment_intent_id).toBeNull()
  })

  it('rejects a non-positive amount', () => {
    expect(() => paymentFields('Cash', 'abc', 0)).toThrow(/> 0/)
  })
})

describe('cross-references', () => {
  const memberKeys = new Set(MEMBERS.map(m => m.key))
  const eventKeys = new Set(EVENTS.map(e => e.key))

  it('registrations, bookings, requests and donations point at real keys', () => {
    for (const r of REGISTRATIONS) {
      expect(memberKeys.has(r.memberKey)).toBe(true)
      expect(eventKeys.has(r.eventKey)).toBe(true)
    }
    for (const b of BOOKINGS) if (b.memberKey) expect(memberKeys.has(b.memberKey)).toBe(true)
    for (const r of REQUESTS) expect(memberKeys.has(r.memberKey)).toBe(true)
    for (const d of DONATIONS) expect(memberKeys.has(d.memberKey)).toBe(true)
  })

  it('a paid registration is for a priced event', () => {
    for (const r of REGISTRATIONS.filter(x => x.pay)) {
      expect(EVENTS.find(e => e.key === r.eventKey)!.memberPrice).toBeGreaterThan(0)
    }
  })

  it('booking numbers are unique and carry the reset prefix', () => {
    expect(new Set(BOOKINGS.map(b => b.number)).size).toBe(BOOKINGS.length)
    for (const b of BOOKINGS) expect(b.number.startsWith(DEMO_BOOKING_PREFIX)).toBe(true)
  })

  it('covers every booking status, so each state can be reviewed', () => {
    expect(new Set(BOOKINGS.map(b => b.status))).toEqual(
      new Set(['Pending Approval', 'Approved', 'Rejected', 'Paid', 'Completed', 'Cancelled'])
    )
  })

  it('the full-capacity event really is full', () => {
    const full = EVENTS.find(e => e.key === 'yoga')!
    const taken = REGISTRATIONS.filter(r => r.eventKey === 'yoga').reduce((n, r) => n + r.primary + r.family + r.guest, 0)
    expect(taken).toBe(full.capacity)
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries in UTC', () => {
    expect(addDays(new Date(Date.UTC(2026, 11, 30)), 3)).toBe('2027-01-02')
    expect(addDays(new Date(Date.UTC(2026, 2, 1)), -1)).toBe('2026-02-28')
  })
})
