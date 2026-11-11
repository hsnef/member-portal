/**
 * Booking rows, shaped for the real `service_bookings` / `service_booking_items`
 * columns (#40).
 *
 * Both booking forms (member `/member/bookings/new`, office
 * `/admin/bookings/new`) used to build these inline, with names the schema
 * does not have: `additional_notes` (it is `notes`), and on items `price`
 * (`item_amount`), `location_address` (`service_address`), `notes`
 * (`item_notes`), with the NOT NULL `service_name` missing. Every insert
 * failed. They now both go through here, and `bookingRows.test.ts` pins the
 * shape.
 *
 * `booking_number` is deliberately absent: the database assigns it
 * (`trigger_auto_generate_booking_number`, BK-YYYY-NNNNN).
 */

/** One service in the booking cart, as the wizard holds it. */
export interface BookingCartItem {
  service_id: string
  service_name: string
  service_date: string
  service_time: string
  location_type: 'Temple' | 'External'
  location_address: string
  purohit_id: string
  purohit_name: string
  notes: string
  price: number
}

export interface BookingHeader {
  memberId: string | null
  membershipId: string | null
  requesterName: string
  requesterPhone: string
  requesterEmail: string
  notes: string
  status: 'Pending Approval' | 'Paid'
  createdBy: string | null
  isWalkIn?: boolean
}

export function cartTotal(cart: Pick<BookingCartItem, 'price'>[]): number {
  return cart.reduce((sum, item) => sum + item.price, 0)
}

export function toBookingRow(h: BookingHeader, cart: BookingCartItem[]) {
  return {
    member_id: h.memberId,
    membership_id: h.membershipId,
    requester_name: h.requesterName.trim(),
    requester_phone: h.requesterPhone.trim(),
    requester_email: h.requesterEmail.trim(),
    total_amount: cartTotal(cart),
    status: h.status,
    notes: h.notes.trim() || null,
    is_walk_in: h.isWalkIn ?? false,
    created_by: h.createdBy,
  }
}

export function toBookingItemRows(bookingId: string, cart: BookingCartItem[]) {
  return cart.map((item) => ({
    booking_id: bookingId,
    service_id: item.service_id,
    service_name: item.service_name,
    service_date: item.service_date,
    service_time: item.service_time || null,
    location_type: item.location_type,
    // Only an external service has an address to record.
    service_address: item.location_type === 'External' ? item.location_address.trim() || null : null,
    purohit_id: item.purohit_id || null,
    purohit_name: item.purohit_name || null,
    item_amount: item.price,
    item_notes: item.notes.trim() || null,
  }))
}
