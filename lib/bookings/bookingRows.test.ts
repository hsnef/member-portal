import { describe, expect, it } from 'vitest'
import { cartTotal, toBookingItemRows, toBookingRow, type BookingCartItem } from './bookingRows'

// Real columns (dev-mp, 2026-11-11). The forms used to send names that are
// not here, and every insert failed (#40).
const BOOKING_COLUMNS = new Set([
  'member_id', 'membership_id', 'requester_name', 'requester_phone', 'requester_email',
  'total_amount', 'status', 'notes', 'is_walk_in', 'created_by',
  // set by the office form when marking paid:
  'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'approval_notes',
])
const ITEM_COLUMNS = new Set([
  'booking_id', 'service_id', 'service_name', 'service_date', 'service_time', 'location_type',
  'service_address', 'purohit_id', 'purohit_name', 'item_amount', 'item_notes',
])

const item = (over: Partial<BookingCartItem> = {}): BookingCartItem => ({
  service_id: 's1',
  service_name: 'Satyanarayana Puja',
  service_date: '2026-12-01',
  service_time: '10:00',
  location_type: 'Temple',
  location_address: 'HSNEF Temple',
  purohit_id: 'p1',
  purohit_name: 'Pandit Rao',
  notes: '',
  price: 101,
  ...over,
})

const header = {
  memberId: 'm1',
  membershipId: '20001200',
  requesterName: ' Asha Rao ',
  requesterPhone: '(904) 555-0100',
  requesterEmail: 'asha@example.org',
  notes: '  ',
  status: 'Pending Approval' as const,
  createdBy: 'u1',
}

describe('toBookingRow', () => {
  it('writes only real service_bookings columns, never booking_number', () => {
    const row = toBookingRow(header, [item()])
    for (const key of Object.keys(row)) expect(BOOKING_COLUMNS.has(key), key).toBe(true)
    expect(row).not.toHaveProperty('booking_number')
    expect(row).not.toHaveProperty('additional_notes')
  })

  it('totals the cart, trims the requester and stores blank notes as null', () => {
    const row = toBookingRow(header, [item(), item({ price: 51 })])
    expect(row.total_amount).toBe(152)
    expect(row.requester_name).toBe('Asha Rao')
    expect(row.notes).toBeNull()
    expect(row.is_walk_in).toBe(false)
  })

  it('totals an empty cart as zero', () => {
    expect(cartTotal([])).toBe(0)
  })
})

describe('toBookingItemRows', () => {
  it('writes only real service_booking_items columns, including the required service_name', () => {
    const [row] = toBookingItemRows('b1', [item()])
    for (const key of Object.keys(row)) expect(ITEM_COLUMNS.has(key), key).toBe(true)
    expect(row.service_name).toBe('Satyanarayana Puja')
    expect(row.item_amount).toBe(101)
    expect(row.booking_id).toBe('b1')
  })

  it('records an address only for an external service', () => {
    const [temple, external] = toBookingItemRows('b1', [
      item(),
      item({ location_type: 'External', location_address: ' 12 Oak St ', notes: ' gate code 4 ' }),
    ])
    expect(temple.service_address).toBeNull()
    expect(external.service_address).toBe('12 Oak St')
    expect(external.item_notes).toBe('gate code 4')
  })

  it('stores a missing time as null rather than an empty string', () => {
    expect(toBookingItemRows('b1', [item({ service_time: '' })])[0].service_time).toBeNull()
  })
})
