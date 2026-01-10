import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/mailer'
import { requestStatusUpdateEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { requestId, status } = await request.json()

    // Verify user is authenticated and has admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request details
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Get member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, membership_id, primary_email, first_name, last_name, business_name, member_class')
      .eq('id', requestData.member_id)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Determine member name
    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name || 'Member'

    // Build payment link for Sent status
    const paymentLink = status === 'Sent'
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/member/requests/${requestId}/payment`
      : undefined

    // Generate email content
    const emailContent = requestStatusUpdateEmail(
      memberName,
      {
        request_number: `REQ-${requestId.slice(0, 8).toUpperCase()}`,
        description: requestData.service_description,
        amount: requestData.amount,
        status: status,
        due_date: requestData.requested_date,
      },
      paymentLink
    )

    // Send email notification
    const emailResult = await sendEmail({
      to: member.primary_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      tags: [
        { name: 'category', value: 'request-notification' },
        { name: 'request_id', value: requestId },
        { name: 'status', value: status },
      ],
    })

    if (!emailResult.success) {
      console.error('Failed to send request notification email:', emailResult.error)
      return NextResponse.json({
        success: false,
        error: 'Failed to send email notification',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      emailSent: true
    })
  } catch (error) {
    console.error('Error sending request notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
