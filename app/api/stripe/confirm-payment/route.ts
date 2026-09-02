import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing payment intent ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not successful', status: paymentIntent.status },
        { status: 400 }
      )
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (existingPayment) {
      // Payment already recorded (by webhook or previous call)
      return NextResponse.json({
        success: true,
        message: 'Payment already recorded',
        alreadyExists: true,
      })
    }

    // Extract metadata
    const {
      memberId,
      category,
      purpose,
      requestId,
    } = paymentIntent.metadata

    if (!memberId) {
      return NextResponse.json(
        { error: 'Missing member ID in payment metadata' },
        { status: 400 }
      )
    }

    // Build notes
    let notes = 'Online payment via Stripe'
    if (category === 'Donation' && purpose) {
      notes = `Donation - ${purpose}`
    } else if (paymentIntent.description) {
      notes = `${notes} - ${paymentIntent.description}`
    }

    // Insert payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        member_id: memberId,
        amount: paymentIntent.amount / 100, // Convert cents to dollars
        payment_date: new Date().toISOString(),
        method: 'Stripe',
        purpose: category || 'Donation',
        stripe_payment_intent_id: paymentIntentId,
        request_id: requestId || null,
        notes,
      })

    if (paymentError) {
      console.error('Error inserting payment:', paymentError)
      return NextResponse.json(
        { error: 'Failed to record payment', details: paymentError.message },
        { status: 500 }
      )
    }

    // If this is a membership payment, update member's current_level
    if (category === 'Membership') {
      const newLevel = paymentIntent.metadata.membershipLevel || 'Annual'
      await supabase
        .from('members')
        .update({ current_level: newLevel })
        .eq('id', memberId)
    }

    // If this is a request payment, update request status
    if (requestId) {
      await supabase
        .from('requests')
        .update({ status: 'Paid' })
        .eq('id', requestId)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
    })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
