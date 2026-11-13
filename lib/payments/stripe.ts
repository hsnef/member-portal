/**
 * Card payments through Stripe. Server only.
 *
 * A payment intent is created for exactly the amount priceCheckout decided,
 * and carries in its metadata what it pays for. When it succeeds, the Stripe
 * webhook AND the member's success page both call settleStripeIntent; the
 * settlement step records it once whichever arrives first, so a member who
 * closes the tab straight after paying is still recorded (by the webhook).
 */

import type Stripe from 'stripe'
import type { PricedCheckout } from './checkout'
import { settlePayment, stripeKey, type SettleDeps, type SettleResult, type SettleTarget } from './settle'

/** What a payment intent's metadata says it pays for. Stripe metadata values are strings. */
export function targetToMetadata(target: SettleTarget): Record<string, string> {
  const md: Record<string, string> = { targetKind: target.kind }
  if ('id' in target) md.targetId = target.id
  if (target.kind === 'membership') md.level = target.level
  if (target.kind === 'donation' && target.purpose) md.purpose = target.purpose
  return md
}

/** The reverse of targetToMetadata; null when the metadata does not describe a target. */
export function metadataToTarget(md: Stripe.Metadata | null | undefined): SettleTarget | null {
  if (!md) return null
  switch (md.targetKind) {
    case 'membership':
      return md.level === 'Annual' || md.level === 'Lifetime' ? { kind: 'membership', level: md.level } : null
    case 'booking':
    case 'request':
    case 'event_registration':
      return md.targetId ? { kind: md.targetKind, id: md.targetId } : null
    case 'donation':
      return md.purpose === 'Sponsorship' ? { kind: 'donation', purpose: 'Sponsorship' } : { kind: 'donation' }
    default:
      return null
  }
}

export async function createCheckoutIntent(
  stripe: Stripe,
  checkout: PricedCheckout,
  member: { id: string; membership_id: string; primary_email: string | null },
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: Math.round(checkout.amount * 100),
    currency: 'usd',
    description: checkout.description,
    receipt_email: member.primary_email ?? undefined,
    automatic_payment_methods: { enabled: true },
    metadata: {
      memberId: member.id,
      membershipId: member.membership_id,
      ...targetToMetadata(checkout.target),
      ...(checkout.notes ? { notes: checkout.notes } : {}),
    },
  })
}

export type StripeSettleOutcome =
  | { state: 'paid'; result: SettleResult; target: SettleTarget }
  | { state: 'processing' | 'failed'; target: SettleTarget | null }

/**
 * Record a payment intent that has succeeded. Safe to call any number of
 * times, from anywhere: the first call records it, the rest return the same
 * receipt.
 */
export async function settleStripeIntent(intent: Stripe.PaymentIntent, deps: SettleDeps): Promise<StripeSettleOutcome> {
  const target = metadataToTarget(intent.metadata)
  if (intent.status === 'processing' || intent.status === 'requires_capture') return { state: 'processing', target }
  if (intent.status !== 'succeeded') return { state: 'failed', target }

  const memberId = intent.metadata?.memberId
  if (!target || !memberId) {
    throw new Error(`Payment intent ${intent.id} succeeded but does not say what it paid for`)
  }

  const charge = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id
  const result = await settlePayment(
    {
      idempotencyKey: stripeKey(intent.id),
      memberId,
      method: 'Stripe',
      amount: (intent.amount_received || intent.amount) / 100,
      target,
      stripePaymentIntentId: intent.id,
      stripeChargeId: charge ?? undefined,
      notes: intent.metadata?.notes || undefined,
      // Recorded when settled (now), not when checkout began: the membership
      // year turns on the payment date (Oct 1 cut-over).
    },
    deps,
  )
  return { state: 'paid', result, target }
}
