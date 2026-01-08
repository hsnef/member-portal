import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error in webhook handler:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const supabase = await createClient()

  const {
    id: stripePaymentId,
    amount,
    metadata,
  } = paymentIntent

  const {
    memberId,
    membershipId,
    category,
  } = metadata

  try {
    // Insert payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        member_id: memberId,
        membership_id: membershipId,
        amount: amount / 100, // Convert cents to dollars
        payment_date: new Date().toISOString(),
        payment_method: 'Online',
        category: category as any,
        stripe_payment_id: stripePaymentId,
        notes: `Online payment via Stripe - ${paymentIntent.description || ''}`,
      })

    if (paymentError) {
      console.error('Error inserting payment:', paymentError)
      throw paymentError
    }

    // If this is a membership payment, update member's current_level
    if (category === 'Membership') {
      const newLevel = metadata.membershipLevel || 'Annual'
      const { error: memberError } = await supabase
        .from('members')
        .update({ current_level: newLevel })
        .eq('id', memberId)

      if (memberError) {
        console.error('Error updating member level:', memberError)
      }
    }

    console.log(`Payment recorded successfully for member ${membershipId}`)
  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.error('Payment failed:', {
    paymentIntentId: paymentIntent.id,
    memberId: paymentIntent.metadata.memberId,
    amount: paymentIntent.amount,
    lastError: paymentIntent.last_payment_error,
  })

  // TODO: Optionally notify member or admin about failed payment
}
