import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { getCurrentMember } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { settleStripeIntent } from '@/lib/payments/stripe'

/**
 * Called by the member's payment success page with { paymentIntentId }.
 * Asks Stripe what happened (never trusts the browser), records the payment
 * if it succeeded (the webhook may already have), and answers with the
 * outcome for the page to show:
 *   { state: 'paid', receiptNumber, targetKind, targetId }
 *   { state: 'processing' | 'failed', targetKind, targetId }
 * Only the member the payment belongs to can ask.
 */
export async function POST(request: NextRequest) {
  try {
    const member = await getCurrentMember()
    if (!member) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })

    const { paymentIntentId } = (await request.json().catch(() => ({}))) as { paymentIntentId?: unknown }
    if (typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 400 })
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null)
    if (!intent || intent.metadata?.memberId !== member.id) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const outcome = await settleStripeIntent(intent, { db: createServiceClient() })
    const target = outcome.target
    return NextResponse.json({
      state: outcome.state,
      receiptNumber: outcome.state === 'paid' ? outcome.result.receiptNumber : null,
      amount: (intent.amount_received || intent.amount) / 100,
      targetKind: target?.kind ?? null,
      targetId: target && 'id' in target ? target.id : null,
    })
  } catch (error) {
    console.error('[confirm-payment] failed:', error)
    return NextResponse.json({ error: 'Could not confirm the payment' }, { status: 500 })
  }
}
