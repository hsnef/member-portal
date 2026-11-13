import { beforeEach, describe, expect, it } from 'vitest'
import { parseCheckoutItem, priceCheckout } from './checkout'

/**
 * A tiny in-memory stand-in for the Supabase query builder: enough for
 * select / eq / neq / maybeSingle / single / insert / count.
 */
type Row = Record<string, any>
let tables: Record<string, Row[]>
const inserted: Array<{ table: string; row: Row }> = []

function fakeDb(): any {
  return {
    from(table: string) {
      const filters: Array<(r: Row) => boolean> = []
      let countMode = false
      let insertRow: Row | null = null
      const rows = () => (tables[table] ?? []).filter((r) => filters.every((f) => f(r)))
      const q: any = {
        select: (_cols?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count) countMode = true
          return q
        },
        eq: (col: string, val: unknown) => (filters.push((r) => r[col] === val), q),
        neq: (col: string, val: unknown) => (filters.push((r) => r[col] !== val), q),
        insert: (row: Row) => {
          insertRow = { id: `new-${inserted.length + 1}`, ...row }
          inserted.push({ table, row: insertRow })
          ;(tables[table] ??= []).push(insertRow)
          return q
        },
        maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
        single: async () => (insertRow ? { data: insertRow, error: null } : { data: rows()[0] ?? null, error: rows()[0] ? null : { code: 'PGRST116' } }),
        then: (resolve: (v: unknown) => void) => resolve(countMode ? { count: rows().length, error: null } : { data: rows(), error: null }),
      }
      return q
    },
  }
}

const member = { id: 'm-1', current_level: 'Community' as const }
const future = '2099-06-01'

beforeEach(() => {
  inserted.length = 0
  tables = {
    portal_settings: [{ setting_key: 'membership_pricing', setting_value: { annual: { price: 151, displayPrice: '$151', description: '' } } }],
    service_bookings: [
      { id: 'bk-1', member_id: 'm-1', status: 'Approved', total_amount: '51.00', booking_number: 'BK-2026-00001' },
      { id: 'bk-2', member_id: 'm-1', status: 'Pending Approval', total_amount: '51.00' },
      { id: 'bk-3', member_id: 'someone-else', status: 'Approved', total_amount: '51.00' },
    ],
    requests: [{ id: 'rq-1', member_id: 'm-1', status: 'Sent', amount: 25, request_number: 'REQ-1' }],
    events: [
      { id: 'ev-paid', event_name: 'Diwali dinner', status: 'Published', event_date: future, registration_deadline: null, is_payable: true, member_price: 20, non_member_price: 30, max_capacity: 2 },
      { id: 'ev-free', event_name: 'Satsang', status: 'Published', event_date: future, registration_deadline: null, is_payable: false, member_price: 0, non_member_price: 0, max_capacity: null },
    ],
    event_registrations: [],
  }
})

describe('parseCheckoutItem', () => {
  it('accepts each kind of item and ignores any amount except a donation\'s', () => {
    expect(parseCheckoutItem({ item: { kind: 'booking', bookingId: 'bk-1', amount: 1 } })).toEqual({ kind: 'booking', bookingId: 'bk-1' })
    expect(parseCheckoutItem({ item: { kind: 'membership', level: 'Lifetime' } })).toEqual({ kind: 'membership', level: 'Lifetime' })
    expect(parseCheckoutItem({ item: { kind: 'donation', amount: 21, fund: 'Annadanam' } })).toEqual({ kind: 'donation', amount: 21, fund: 'Annadanam' })
  })

  it('rejects anything malformed', () => {
    expect(parseCheckoutItem(null)).toBeNull()
    expect(parseCheckoutItem({ amount: 100 })).toBeNull()
    expect(parseCheckoutItem({ item: { kind: 'membership', level: 'annual' } })).toBeNull() // the old lower-case bug
    expect(parseCheckoutItem({ item: { kind: 'donation', amount: 21, fund: 'Made up' } })).toBeNull()
    expect(parseCheckoutItem({ item: { kind: 'refund' } })).toBeNull()
  })
})

describe('priceCheckout', () => {
  it('prices membership from Portal Settings, falling back to the defaults', async () => {
    const annual = await priceCheckout(fakeDb(), member, { kind: 'membership', level: 'Annual' })
    expect(annual).toMatchObject({ ok: true, checkout: { amount: 151, target: { kind: 'membership', level: 'Annual' } } })
    const lifetime = await priceCheckout(fakeDb(), member, { kind: 'membership', level: 'Lifetime' })
    expect(lifetime).toMatchObject({ ok: true, checkout: { amount: 1008 } }) // default, not set by the Admin
  })

  it('refuses membership for someone already Lifetime', async () => {
    const out = await priceCheckout(fakeDb(), { id: 'm-1', current_level: 'Lifetime' }, { kind: 'membership', level: 'Annual' })
    expect(out).toMatchObject({ ok: false, status: 400 })
  })

  it('charges a booking its own total, only when approved and only to its member', async () => {
    expect(await priceCheckout(fakeDb(), member, { kind: 'booking', bookingId: 'bk-1' })).toMatchObject({
      ok: true,
      checkout: { amount: 51, target: { kind: 'booking', id: 'bk-1' } },
    })
    expect(await priceCheckout(fakeDb(), member, { kind: 'booking', bookingId: 'bk-2' })).toMatchObject({ ok: false, status: 400 })
    expect(await priceCheckout(fakeDb(), member, { kind: 'booking', bookingId: 'bk-3' })).toMatchObject({ ok: false, status: 404 })
  })

  it('charges a request its own amount', async () => {
    expect(await priceCheckout(fakeDb(), member, { kind: 'request', requestId: 'rq-1' })).toMatchObject({
      ok: true,
      checkout: { amount: 25, target: { kind: 'request', id: 'rq-1' } },
    })
  })

  it('keeps donations within the limits and records the fund', async () => {
    expect(await priceCheckout(fakeDb(), member, { kind: 'donation', amount: 0.5, fund: 'General' })).toMatchObject({ ok: false, status: 400 })
    expect(await priceCheckout(fakeDb(), member, { kind: 'donation', amount: 1_000_000, fund: 'General' })).toMatchObject({ ok: false })
    expect(await priceCheckout(fakeDb(), member, { kind: 'donation', amount: 21.005, fund: 'Building' })).toMatchObject({
      ok: true,
      checkout: { amount: 21.01, notes: 'Donation - Building', target: { kind: 'donation' } },
    })
  })

  it('prices a paid event for the member and holds their place', async () => {
    const out = await priceCheckout(fakeDb(), member, { kind: 'event', eventId: 'ev-paid' })
    expect(out).toMatchObject({ ok: true, checkout: { amount: 30, target: { kind: 'event_registration' } } }) // Community pays the non-member price
    expect(inserted).toEqual([{ table: 'event_registrations', row: expect.objectContaining({ status: 'Pending Payment', member_id: 'm-1' }) }])

    // Asking again reuses the same hold.
    const again = await priceCheckout(fakeDb(), member, { kind: 'event', eventId: 'ev-paid' })
    expect(again.ok && again.checkout.target).toEqual(out.ok && out.checkout.target)
    expect(inserted).toHaveLength(1)
  })

  it('charges Annual and Lifetime members the member price', async () => {
    const out = await priceCheckout(fakeDb(), { id: 'm-2', current_level: 'Annual' }, { kind: 'event', eventId: 'ev-paid' })
    expect(out).toMatchObject({ ok: true, checkout: { amount: 20 } })
  })

  it('refuses a free event, and a full one', async () => {
    expect(await priceCheckout(fakeDb(), member, { kind: 'event', eventId: 'ev-free' })).toMatchObject({ ok: false, status: 400 })
    tables.event_registrations.push(
      { id: 'r1', event_id: 'ev-paid', member_id: 'a', status: 'Confirmed' },
      { id: 'r2', event_id: 'ev-paid', member_id: 'b', status: 'Pending Payment' },
    )
    expect(await priceCheckout(fakeDb(), member, { kind: 'event', eventId: 'ev-paid' })).toMatchObject({ ok: false, error: 'This event is full' })
  })
})
