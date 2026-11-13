import { describe, expect, it } from 'vitest'
import { eventPriceFor, registrationClosedReason } from './registration'

describe('eventPriceFor', () => {
  const event = { member_price: 20, non_member_price: 30 }
  it('gives paid members the member price and everyone else the non-member price', () => {
    expect(eventPriceFor(event, 'Annual')).toBe(20)
    expect(eventPriceFor(event, 'Lifetime')).toBe(20)
    expect(eventPriceFor(event, 'Community')).toBe(30)
  })
  it('treats a missing price as free', () => {
    expect(eventPriceFor({ member_price: null, non_member_price: null }, 'Community')).toBe(0)
  })
})

describe('registrationClosedReason', () => {
  const now = new Date('2026-11-12T12:00:00-05:00')
  const open = { status: 'Published' as const, registration_deadline: null, event_date: '2026-11-20' }

  it('is open for a published event before its deadline and its day', () => {
    expect(registrationClosedReason(open, now)).toBeNull()
    expect(registrationClosedReason({ ...open, event_date: '2026-11-12' }, now)).toBeNull() // still the day itself
  })
  it('is closed for drafts, after the deadline, and after the event', () => {
    expect(registrationClosedReason({ ...open, status: 'Draft' }, now)).toMatch(/not open/)
    expect(registrationClosedReason({ ...open, registration_deadline: '2026-11-11T23:00:00-05:00' }, now)).toMatch(/closed/)
    expect(registrationClosedReason({ ...open, event_date: '2026-11-10' }, now)).toMatch(/taken place/)
  })
})
