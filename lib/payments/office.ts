/**
 * Payments the office takes in person: cash, cheque, Zelle, or a card on the
 * temple's own machine. Server only; the caller has already checked the
 * signed-in user is office staff.
 *
 * The office says who paid, for what, and how. The amount comes from the
 * item (priceCheckout), exactly as for an online payment, and the payment is
 * recorded through the one settlement step, so the booking or membership is
 * marked paid and a receipt emailed just as if the member had paid online.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { priceCheckout, readMembershipPricing, type CheckoutItem } from './checkout'
import { eventPriceFor, registrationClosedReason } from '@/lib/events/registration'
import { settlePayment, type SettleDeps, type SettleResult } from './settle'

type Client = SupabaseClient<Database>

export const OFFICE_METHODS = ['Cash', 'Check', 'Zelle', 'Card'] as const
export type OfficeMethod = (typeof OFFICE_METHODS)[number]

export interface OfficePaymentInput {
  /**
   * A fresh id per form, from the browser (crypto.randomUUID()). Submitting
   * the same form twice records one payment.
   */
  submissionId: string
  memberId: string
  method: OfficeMethod
  item: CheckoutItem
  checkNumber?: string
  /** Zelle confirmation number, or the card machine's receipt reference. */
  reference?: string
  notes?: string
}

export type OfficePaymentOutcome =
  | { ok: true; result: SettleResult; amount: number; description: string }
  | { ok: false; status: number; error: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Check an untrusted body. Returns the input, or the reason it is unusable. */
export function parseOfficePayment(body: unknown, item: CheckoutItem | null): OfficePaymentInput | string {
  const b = (body ?? {}) as Record<string, unknown>
  if (typeof b.submissionId !== 'string' || !UUID.test(b.submissionId)) return 'Missing form id; reload the page'
  if (typeof b.memberId !== 'string' || !b.memberId) return 'Choose who paid'
  if (!OFFICE_METHODS.includes(b.method as OfficeMethod)) return 'Choose how they paid'
  if (!item) return 'Choose what the payment is for'
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : undefined)
  const input: OfficePaymentInput = {
    submissionId: b.submissionId,
    memberId: b.memberId,
    method: b.method as OfficeMethod,
    item,
    checkNumber: text(b.checkNumber),
    reference: text(b.reference),
    notes: text(b.notes),
  }
  if (input.method === 'Check' && !input.checkNumber) return 'Enter the cheque number'
  return input
}

export async function recordOfficePayment(
  db: Client,
  staffUserId: string,
  input: OfficePaymentInput,
  deps: Omit<SettleDeps, 'db'> = {},
): Promise<OfficePaymentOutcome> {
  const { data: member } = await db.from('members').select('id, current_level').eq('id', input.memberId).maybeSingle()
  if (!member) return { ok: false, status: 404, error: 'Member not found' }

  const priced = await priceCheckout(db, member, input.item)
  if (!priced.ok) return priced
  const { checkout } = priced

  const notes = [
    checkout.notes,
    input.method === 'Card' && input.reference ? `Card machine ref ${input.reference}` : undefined,
    input.notes,
  ]
    .filter(Boolean)
    .join(' · ')

  try {
    const result = await settlePayment(
      {
        idempotencyKey: `office:${input.submissionId}`,
        memberId: member.id,
        method: input.method,
        amount: checkout.amount,
        target: checkout.target,
        checkNumber: input.method === 'Check' ? input.checkNumber : undefined,
        zelleReference: input.method === 'Zelle' ? input.reference : undefined,
        notes: notes || undefined,
        createdBy: staffUserId,
      },
      { db, ...deps },
    )
    return { ok: true, result, amount: checkout.amount, description: checkout.description }
  } catch (error) {
    // The database refuses with a reason (already paid, wrong state...).
    const message = error instanceof Error ? error.message.replace(/^settle_payment failed: (settle_payment: )?/, '') : 'Could not record the payment'
    return { ok: false, status: 409, error: message }
  }
}

/** What a member could pay for at the counter, with the server's prices. */
export interface OpenItems {
  member: { id: string; currentLevel: string; requestedLevel: string | null }
  membership: { annual: number; lifetime: number; canBuy: boolean }
  bookings: Array<{ id: string; label: string; amount: number }>
  requests: Array<{ id: string; label: string; amount: number }>
  events: Array<{ id: string; label: string; amount: number; eventDate: string }>
}

export async function listOpenItems(db: Client, memberId: string): Promise<OpenItems | null> {
  const { data: member } = await db
    .from('members')
    .select('id, current_level, requested_level')
    .eq('id', memberId)
    .maybeSingle()
  if (!member) return null

  const today = new Date().toISOString().slice(0, 10)
  const [pricing, bookings, requests, events, registrations] = await Promise.all([
    readMembershipPricing(db),
    db.from('service_bookings').select('id, booking_number, total_amount').eq('member_id', memberId).eq('status', 'Approved'),
    db.from('requests').select('id, request_number, description, amount, status').eq('member_id', memberId).in('status', ['Sent', 'Partially Paid']),
    db.from('events').select('*').eq('status', 'Published').eq('is_payable', true).gte('event_date', today).order('event_date'),
    db.from('event_registrations').select('event_id').eq('member_id', memberId).eq('status', 'Confirmed'),
  ])
  const registered = new Set((registrations.data ?? []).map((r) => r.event_id))

  return {
    member: { id: member.id, currentLevel: member.current_level, requestedLevel: member.requested_level },
    membership: {
      annual: Number(pricing.annual.price),
      lifetime: Number(pricing.lifetime.price),
      canBuy: member.current_level !== 'Lifetime',
    },
    bookings: (bookings.data ?? []).map((b) => ({ id: b.id, label: `Booking ${b.booking_number}`, amount: Number(b.total_amount) })),
    requests: (requests.data ?? []).map((r) => ({ id: r.id, label: `${r.request_number}: ${r.description}`, amount: Number(r.amount) })),
    events: (events.data ?? [])
      .filter((e) => !registered.has(e.id) && !registrationClosedReason(e))
      .map((e) => ({ id: e.id, label: e.event_name, amount: eventPriceFor(e, member.current_level), eventDate: e.event_date }))
      .filter((e) => e.amount > 0),
  }
}
