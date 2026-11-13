/**
 * Pricing a checkout on the server. The browser says WHAT is being paid for;
 * this decides how much, and checks that it belongs to the member and can be
 * paid now. Card (Stripe) and Zelle both start here, so a payment can only
 * ever be for the amount the portal itself asked for.
 *
 * Spec: docs/architecture/payments.md, "The amount is always the server's".
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Member } from '@/types/database'
import { DEFAULT_MEMBERSHIP_PRICING, type MembershipPricing } from '@/lib/utils/portalSettings'
import { DONATION_MAX, DONATION_MIN, isDonationFund } from './donations'
import { eventPriceFor, holdRegistration } from '@/lib/events/registration'
import type { SettleTarget } from './settle'

type Client = SupabaseClient<Database>

/** What a member asks to pay for. Never carries an amount, except a donation's. */
export type CheckoutItem =
  | { kind: 'membership'; level: 'Annual' | 'Lifetime' }
  | { kind: 'booking'; bookingId: string }
  | { kind: 'request'; requestId: string }
  | { kind: 'event'; eventId: string }
  | { kind: 'donation'; amount: number; fund: string }

export interface PricedCheckout {
  /** Dollars. */
  amount: number
  target: SettleTarget
  /** Shown on the card statement and the payment page. */
  description: string
  /** Recorded on the payment (the donation fund). */
  notes?: string
}

export type CheckoutOutcome = { ok: true; checkout: PricedCheckout } | { ok: false; status: number; error: string }

const fail = (status: number, error: string): CheckoutOutcome => ({ ok: false, status, error })

/** Parse an untrusted request body into a CheckoutItem, or null. */
export function parseCheckoutItem(body: unknown): CheckoutItem | null {
  const item = (body as { item?: Record<string, unknown> } | null)?.item
  if (!item || typeof item !== 'object') return null
  const str = (v: unknown) => (typeof v === 'string' && v.length > 0 && v.length < 100 ? v : null)
  switch (item.kind) {
    case 'membership':
      return item.level === 'Annual' || item.level === 'Lifetime' ? { kind: 'membership', level: item.level } : null
    case 'booking':
      return str(item.bookingId) ? { kind: 'booking', bookingId: item.bookingId as string } : null
    case 'request':
      return str(item.requestId) ? { kind: 'request', requestId: item.requestId as string } : null
    case 'event':
      return str(item.eventId) ? { kind: 'event', eventId: item.eventId as string } : null
    case 'donation':
      return typeof item.amount === 'number' && isDonationFund(item.fund)
        ? { kind: 'donation', amount: item.amount, fund: item.fund }
        : null
    default:
      return null
  }
}

/** Membership prices as an Admin set them in Portal Settings. */
export async function readMembershipPricing(db: Client): Promise<MembershipPricing> {
  const { data } = await db
    .from('portal_settings')
    .select('setting_value')
    .eq('setting_key', 'membership_pricing')
    .maybeSingle()
  const value = data?.setting_value as Partial<MembershipPricing> | null
  return { ...DEFAULT_MEMBERSHIP_PRICING, ...(value ?? {}) }
}

/** Round to cents, so 101.1 and 101.10 compare equal. */
const cents = (n: number) => Math.round(n * 100) / 100

/**
 * Work out what `member` pays for `item`. `db` is a service-role client; every
 * ownership check is made here, not left to row-level security.
 */
export async function priceCheckout(db: Client, member: Pick<Member, 'id' | 'current_level'>, item: CheckoutItem): Promise<CheckoutOutcome> {
  switch (item.kind) {
    case 'membership': {
      if (member.current_level === 'Lifetime') return fail(400, 'You are already a Lifetime member')
      const pricing = await readMembershipPricing(db)
      const amount = cents(Number(item.level === 'Lifetime' ? pricing.lifetime.price : pricing.annual.price))
      if (!(amount > 0)) return fail(400, 'This membership level has no price set; please contact the office')
      return {
        ok: true,
        checkout: { amount, target: { kind: 'membership', level: item.level }, description: `HSNEF ${item.level} membership` },
      }
    }

    case 'booking': {
      const { data: booking } = await db.from('service_bookings').select('*').eq('id', item.bookingId).maybeSingle()
      if (!booking || booking.member_id !== member.id) return fail(404, 'Booking not found')
      if (booking.status === 'Paid' || booking.status === 'Completed') return fail(409, 'This booking is already paid')
      if (booking.status !== 'Approved') return fail(400, 'This booking cannot be paid until the office approves it')
      const amount = cents(Number(booking.total_amount))
      if (!(amount > 0)) return fail(400, 'This booking has nothing to pay')
      return {
        ok: true,
        checkout: {
          amount,
          target: { kind: 'booking', id: booking.id },
          description: `HSNEF booking ${booking.booking_number ?? ''}`.trim(),
        },
      }
    }

    case 'request': {
      const { data: request } = await db.from('requests').select('*').eq('id', item.requestId).maybeSingle()
      if (!request || request.member_id !== member.id) return fail(404, 'Request not found')
      if (request.status === 'Paid') return fail(409, 'This request is already paid')
      if (request.status !== 'Sent' && request.status !== 'Partially Paid') return fail(400, 'This request is not ready to be paid')
      const amount = cents(Number(request.amount))
      return {
        ok: true,
        checkout: { amount, target: { kind: 'request', id: request.id }, description: `HSNEF request ${request.request_number}` },
      }
    }

    case 'event': {
      const { data: event } = await db.from('events').select('*').eq('id', item.eventId).maybeSingle()
      if (!event) return fail(404, 'Event not found')
      const amount = cents(eventPriceFor(event, member.current_level))
      if (!event.is_payable || !(amount > 0)) return fail(400, 'This event is free; register without paying')
      const held = await holdRegistration(db, { eventId: event.id, memberId: member.id, paid: true })
      if (!held.ok) return fail(held.status, held.error)
      return {
        ok: true,
        checkout: {
          amount,
          target: { kind: 'event_registration', id: held.registrationId },
          description: `HSNEF event: ${event.event_name}`,
        },
      }
    }

    case 'donation': {
      const amount = cents(item.amount)
      if (!(amount >= DONATION_MIN) || amount > DONATION_MAX) {
        return fail(400, `Donations are between $${DONATION_MIN} and $${DONATION_MAX.toLocaleString('en-US')}`)
      }
      return {
        ok: true,
        checkout: {
          amount,
          target: { kind: 'donation' },
          description: `HSNEF donation: ${item.fund}`,
          notes: `Donation - ${item.fund}`,
        },
      }
    }
  }
}
