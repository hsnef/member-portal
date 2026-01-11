import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { sendEmail } from '@/lib/email/mailer'
import { getPaymentFailureEmail, getPaymentSuccessEmail } from '@/lib/email/templates/payment'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

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
    purpose, // For donations: General, Building, Festival, etc.
    requestId, // For service request payments
  } = metadata

  // Build notes with relevant metadata
  let notes = `Online payment via Stripe`
  if (category === 'Donation' && purpose) {
    notes = `Donation - ${purpose}`
  } else if (paymentIntent.description) {
    notes = `${notes} - ${paymentIntent.description}`
  }

  try {
    // Check if payment record already exists (to avoid duplicates from webhook + confirm-payment API)
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_payment_intent_id', stripePaymentId)
      .maybeSingle()

    if (existingPayment) {
      console.log(`Payment already recorded for ${stripePaymentId}, skipping webhook insert`)
      return
    }

    // For Event payments, registration is handled by confirm-payment API which also creates payment
    // So skip webhook processing for events to avoid duplication
    if (category === 'Event') {
      console.log(`Event payment ${stripePaymentId} will be processed by confirm-payment API`)
      return
    }

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
        request_id: requestId || null,
        notes,
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

    // If this is a request payment, update request status
    if (requestId) {
      const { error: requestError } = await supabase
        .from('requests')
        .update({ status: 'Paid' })
        .eq('id', requestId)

      if (requestError) {
        console.error('Error updating request status:', requestError)
      }
    }

    console.log(`Payment recorded successfully for member ${membershipId}`)

    // Send payment success email notification
    try {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('primary_email, first_name, last_name, business_name, member_class')
        .eq('id', memberId)
        .single()

      if (memberError || !member) {
        console.error('Could not find member for payment success notification:', memberError)
      } else {
        // Determine member name
        const memberName = member.member_class === 'Personal'
          ? `${member.first_name} ${member.last_name}`
          : member.business_name || 'Member'

        // Build receipt URL
        const receiptUrl = `${TEMPLE_CONFIG.contact.memberPortal}/member/payments`

        // Format payment date
        const paymentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        // Determine category display name
        let categoryDisplay = category || 'Payment'
        if (category === 'Donation' && purpose) {
          categoryDisplay = `Donation - ${purpose}`
        }

        // Generate email content
        const emailContent = getPaymentSuccessEmail({
          memberName,
          membershipId: membershipId || 'N/A',
          amount: amount / 100, // Convert cents to dollars
          category: categoryDisplay,
          paymentDate,
          receiptUrl,
        })

        // Send email notification
        const emailResult = await sendEmail({
          to: member.primary_email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          tags: [
            { name: 'category', value: 'payment-success' },
            { name: 'payment_type', value: category || 'unknown' },
          ],
        })

        if (emailResult.success) {
          console.log(`Payment confirmation email sent to ${member.primary_email}`)
        } else {
          console.error('Failed to send payment success email:', emailResult.error)
        }
      }
    } catch (emailError) {
      // Don't throw - email failure shouldn't break the payment flow
      console.error('Error sending payment success notification:', emailError)
    }
  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const supabase = await createClient()

  const {
    id: stripePaymentId,
    amount,
    metadata,
    last_payment_error,
  } = paymentIntent

  const {
    memberId,
    membershipId,
    category,
  } = metadata

  console.error('Payment failed:', {
    paymentIntentId: stripePaymentId,
    memberId,
    membershipId,
    amount,
    lastError: last_payment_error,
  })

  // Get member details to send email
  try {
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('primary_email, first_name, last_name, business_name, member_class')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      console.error('Could not find member for payment failure notification:', memberError)
      return
    }

    // Determine member name
    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name || 'Member'

    // Determine retry URL based on payment category
    let retryUrl = `${TEMPLE_CONFIG.contact.memberPortal}/member`
    if (category === 'Membership') {
      retryUrl = `${TEMPLE_CONFIG.contact.memberPortal}/member/renew`
    } else if (category === 'Donation') {
      retryUrl = `${TEMPLE_CONFIG.contact.memberPortal}/member/donate`
    } else if (category === 'Service' || category === 'Request') {
      retryUrl = `${TEMPLE_CONFIG.contact.memberPortal}/member/requests`
    } else if (category === 'Event') {
      retryUrl = `${TEMPLE_CONFIG.contact.memberPortal}/member/events`
    }

    // Get error message
    const errorMessage = last_payment_error?.message ||
      (last_payment_error?.decline_code ? `Card declined: ${last_payment_error.decline_code}` : undefined)

    // Generate email content
    const emailContent = getPaymentFailureEmail({
      memberName,
      membershipId: membershipId || 'N/A',
      amount: amount / 100, // Convert cents to dollars
      category: category || 'Payment',
      errorMessage,
      retryUrl,
    })

    // Send email notification
    const emailResult = await sendEmail({
      to: member.primary_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      tags: [
        { name: 'category', value: 'payment-failure' },
        { name: 'payment_type', value: category || 'unknown' },
      ],
    })

    if (emailResult.success) {
      console.log(`Payment failure notification sent to ${member.primary_email}`)
    } else {
      console.error('Failed to send payment failure email:', emailResult.error)
    }
  } catch (error) {
    console.error('Error sending payment failure notification:', error)
  }
}
