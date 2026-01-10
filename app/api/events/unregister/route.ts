import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/mailer'
import { eventCancellationEmail } from '@/lib/email/templates'

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

    // Get event details before cancellation
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_name, event_date, event_time, location')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete registration
    const { error: deleteError } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('member_id', member.id)

    if (deleteError) {
      console.error('Error cancelling registration:', deleteError)
      return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 })
    }

    // Send cancellation email
    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name || 'Member'

    const emailContent = eventCancellationEmail(memberName, {
      event_name: event.event_name,
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location,
    })

    const emailResult = await sendEmail({
      to: member.primary_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      tags: [
        { name: 'category', value: 'event-cancellation' },
        { name: 'event_id', value: eventId },
      ],
    })

    if (!emailResult.success) {
      console.error('Failed to send event cancellation email:', emailResult.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled successfully',
      emailSent: emailResult.success
    })
  } catch (error) {
    console.error('Error in event cancellation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
