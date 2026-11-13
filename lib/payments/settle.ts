/**
 * Settling a payment: the ONE way anything in the portal is marked paid.
 *
 * Card (Stripe webhook), Zelle (staff confirmation, bank import) and
 * office-recorded payments all call settlePayment(). It runs the database
 * function settle_payment (migration 20261112000003) with the service role:
 * one transaction records the payment, marks the item paid, writes membership
 * dates and creates the numbered receipt. Then the receipt is emailed.
 *
 * Server only. The browser never marks anything paid.
 * Spec: docs/architecture/payments.md.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, MembershipLevel, PaymentMethod, PaymentPurpose } from '@/types/database'
import { paymentReceiptEmail } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email/mailer'

/** What is being paid for. Every item except a donation carries its own price. */
export type SettleTarget =
  | { kind: 'membership'; level: Extract<MembershipLevel, 'Annual' | 'Lifetime'> }
  | { kind: 'booking'; id: string }
  | { kind: 'request'; id: string }
  | { kind: 'event_registration'; id: string }
  | { kind: 'donation'; purpose?: Extract<PaymentPurpose, 'Donation' | 'Sponsorship'> }

export interface SettleInput {
  /**
   * Names where the money came from, so the same payment can never be
   * recorded twice: `stripe:<payment intent>`, `zelle:<request id>`,
   * `office:<form submission id>`.
   */
  idempotencyKey: string
  memberId: string
  method: PaymentMethod
  amount: number
  target: SettleTarget
  stripePaymentIntentId?: string
  stripeChargeId?: string
  checkNumber?: string
  zelleReference?: string
  notes?: string
  /** The staff user who recorded it; empty for card payments. */
  createdBy?: string
  paidAt?: Date
}

export interface SettleResult {
  paymentId: string
  receiptId: string
  receiptNumber: string
  /** True when this source had already been settled: nothing new was written. */
  alreadySettled: boolean
  /** Whether the receipt email went out on this call. */
  receiptEmailed: boolean
}

/** The payments.purpose a target records under. */
export function purposeFor(target: SettleTarget): PaymentPurpose {
  switch (target.kind) {
    case 'membership':
      return 'Membership'
    case 'booking':
      return 'Service'
    case 'request':
      return 'Request'
    case 'event_registration':
      return 'Event'
    case 'donation':
      return target.purpose ?? 'Donation'
  }
}

/** The idempotency key for a Stripe payment intent. */
export const stripeKey = (paymentIntentId: string) => `stripe:${paymentIntentId}`

type Client = SupabaseClient<Database>

export interface SettleDeps {
  /** A service-role client: settle_payment is not callable by anyone else. */
  db: Client
  send?: typeof sendEmail
}

export async function settlePayment(input: SettleInput, { db, send = sendEmail }: SettleDeps): Promise<SettleResult> {
  if (!(input.amount > 0)) throw new Error('settlePayment: amount must be positive')
  if (!input.idempotencyKey) throw new Error('settlePayment: idempotencyKey is required')

  const { target } = input
  const { data, error } = await db.rpc('settle_payment', {
    p_idempotency_key: input.idempotencyKey,
    p_member_id: input.memberId,
    p_purpose: purposeFor(target),
    p_method: input.method,
    p_amount: input.amount,
    p_target_kind: target.kind,
    p_target_id: 'id' in target ? target.id : null,
    p_level: target.kind === 'membership' ? target.level : null,
    p_stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    p_stripe_charge_id: input.stripeChargeId ?? null,
    p_check_number: input.checkNumber ?? null,
    p_zelle_reference: input.zelleReference ?? null,
    p_notes: input.notes ?? null,
    p_created_by: input.createdBy ?? null,
    p_paid_at: (input.paidAt ?? new Date()).toISOString(),
  })
  if (error) throw new Error(`settle_payment failed: ${error.message}`)
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('settle_payment returned nothing')

  const result: SettleResult = {
    paymentId: row.payment_id,
    receiptId: row.receipt_id,
    receiptNumber: row.receipt_number,
    alreadySettled: row.already_settled,
    receiptEmailed: false,
  }

  // The money is recorded whatever happens next; a failed email is logged and
  // can be resent from the receipt. A repeat call re-sends only if the first
  // send never succeeded.
  result.receiptEmailed = await emailReceipt(result.receiptId, { db, send })
  return result
}

/**
 * Email a receipt to its member, once. Returns true if an email went out on
 * this call. Safe to call again: a receipt already emailed is skipped.
 */
export async function emailReceipt(receiptId: string, { db, send = sendEmail }: SettleDeps): Promise<boolean> {
  const { data: receipt, error } = await db.from('receipts').select('*').eq('id', receiptId).single()
  if (error || !receipt) {
    console.error('[payments] receipt not found for email', receiptId, error?.message)
    return false
  }
  if (receipt.email_sent_at) return false

  const { data: member } = await db.from('members').select('*').eq('id', receipt.member_id).single()
  if (!member?.primary_email) {
    console.error('[payments] no email address for receipt', receipt.receipt_number)
    return false
  }

  const content = paymentReceiptEmail(member, { ...receipt, amount: Number(receipt.amount) })
  const sent = await send({
    to: member.primary_email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: [
      { name: 'category', value: 'receipt' },
      { name: 'receipt', value: receipt.receipt_number },
    ],
  })
  if (!sent.success) {
    console.error('[payments] receipt email failed', receipt.receipt_number, sent.error)
    return false
  }
  await db.from('receipts').update({ email_sent_at: new Date().toISOString() }).eq('id', receiptId)
  return true
}
