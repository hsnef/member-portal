import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/mailer'
import { eventRegistrationEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { eventId } = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, membership_id, primary_email, first_name, last_name, business_name, member_class')
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
      return NextResponse.json({ error: 'Already registered for this event' }, { status: 400 })
    }

    // Check capacity
    if (event.max_capacity > 0) {
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)

      if (count && count >= event.max_capacity) {
        return NextResponse.json({ error: 'Event is full' }, { status: 400 })
      }
    }

    // Create registration
    const { error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        member_id: member.id,
        membership_id: member.membership_id,
        registration_date: new Date().toISOString(),
        registration_status: 'Confirmed',
      })

    if (regError) {
      console.error('Error creating registration:', regError)
      return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
    }

    // Send confirmation email
    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name || 'Member'

    const emailContent = eventRegistrationEmail(memberName, member.membership_id, {
      event_name: event.event_name,
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location,
      description: event.description,
      category: event.category,
      member_price: event.member_price,
    })

    const emailResult = await sendEmail({
      to: member.primary_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      tags: [
        { name: 'category', value: 'event-registration' },
        { name: 'event_id', value: eventId },
      ],
    })

    if (!emailResult.success) {
      console.error('Failed to send event registration email:', emailResult.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for event',
      emailSent: emailResult.success
    })
  } catch (error) {
    console.error('Error in event registration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
