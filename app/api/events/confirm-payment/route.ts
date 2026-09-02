import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { sendEmail } from '@/lib/email/mailer'
import { eventRegistrationEmail } from '@/lib/email/templates'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { eventId, paymentIntentId } = await request.json()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, membership_id, first_name, last_name, primary_email, current_level')
      .eq('auth_user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if already registered
    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('member_id', member.id)
      .single()

    if (existingReg) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 })
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Verify the payment is for this event and member
    if (paymentIntent.metadata?.eventId !== eventId || paymentIntent.metadata?.memberId !== member.id) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    const amountPaid = paymentIntent.amount / 100 // Convert from cents

    // Record payment in payments table
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        member_id: member.id,
        amount: amountPaid,
        category: 'Event',
        description: `Event Registration - ${event.event_name}`,
        payment_method: 'Stripe',
        stripe_payment_intent_id: paymentIntentId,
        status: 'Completed',
        payment_date: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }

    // Create event registration
    const { error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        member_id: member.id,
        payment_id: payment.id,
        amount_paid: amountPaid,
        registered_at: new Date().toISOString(),
      })

    if (regError) {
      console.error('Error creating registration:', regError)
      return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 })
    }

    // Send confirmation email
    try {
      const memberName = `${member.first_name} ${member.last_name}`
      const emailContent = eventRegistrationEmail(memberName, member.membership_id, {
        event_name: event.event_name,
        event_date: event.event_date,
        event_time: event.event_time,
        location: event.location,
        category: event.category || 'Event',
        member_price: amountPaid,
      })

      await sendEmail({
        to: member.primary_email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        tags: [
          { name: 'category', value: 'event-registration' },
          { name: 'event_id', value: eventId },
          { name: 'member_id', value: member.id },
        ],
      })
    } catch (emailError) {
      // Don't fail the registration if email fails
      console.error('Failed to send confirmation email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
    })
  } catch (error) {
    console.error('Error confirming event payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
