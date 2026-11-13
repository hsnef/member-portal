import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/config'
import { createServiceClient } from '@/lib/supabase/client'
import { sendEmail } from '@/lib/email/mailer'
import { getPaymentFailureEmail } from '@/lib/email/templates/payment'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'
import { metadataToTarget, settleStripeIntent } from '@/lib/payments/stripe'

/**
 * Stripe calls this for every card payment. A succeeded payment is recorded
 * through the one settlement step (lib/payments/settle.ts); the member's
 * success page does the same, and whichever arrives second changes nothing.
 * Runs with the service role: Stripe is not a signed-in user.
 */

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    const db = createServiceClient()
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const outcome = await settleStripeIntent(event.data.object as Stripe.PaymentIntent, { db })
        if (outcome.state === 'paid') {
          console.log(
            `[stripe webhook] ${event.data.object.id}: ${outcome.result.alreadySettled ? 'already recorded' : 'recorded'} as ${outcome.result.receiptNumber}`,
          )
        }
        break
      }
      case 'payment_intent.payment_failed':
        await notifyPaymentFailure(event.data.object as Stripe.PaymentIntent, db)
        break
      default:
        break
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    // A 500 makes Stripe retry, which is what we want if the database refused
    // for a passing reason; the settlement step makes the retry harmless.
    console.error('[stripe webhook] handler failed:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

/** Where a member can try again, by what the payment was for. */
function retryPath(intent: Stripe.PaymentIntent): string {
  const target = metadataToTarget(intent.metadata)
  switch (target?.kind) {
    case 'membership':
      return '/member/renew'
    case 'donation':
      return '/member/donate'
    case 'booking':
      return `/member/bookings/${target.id}`
    case 'request':
      return '/member/requests'
    case 'event_registration':
      return '/member/events'
    default:
      return '/member'
  }
}

async function notifyPaymentFailure(intent: Stripe.PaymentIntent, db: ReturnType<typeof createServiceClient>) {
  const memberId = intent.metadata?.memberId
  if (!memberId) return
  const { data: member } = await db
    .from('members')
    .select('primary_email, first_name, last_name, business_name, member_class, membership_id')
    .eq('id', memberId)
    .single()
  if (!member?.primary_email) return

  const memberName =
    member.member_class === 'Personal' ? `${member.first_name} ${member.last_name}` : member.business_name || 'Member'
  const error = intent.last_payment_error
  const content = getPaymentFailureEmail({
    memberName,
    membershipId: member.membership_id || 'N/A',
    amount: intent.amount / 100,
    category: intent.description || 'Payment',
    errorMessage: error?.message || (error?.decline_code ? `Card declined: ${error.decline_code}` : undefined),
    retryUrl: `${TEMPLE_CONFIG.contact.memberPortal}${retryPath(intent)}`,
  })
  const sent = await sendEmail({
    to: member.primary_email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: [{ name: 'category', value: 'payment-failure' }],
  })
  if (!sent.success) console.error('[stripe webhook] failure email not sent:', sent.error)
}
