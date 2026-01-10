import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/mailer'
import { registrationInvitationEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { memberId } = await request.json()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Build invitation link - points to registration page
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/register?email=${encodeURIComponent(member.primary_email)}`

    // Generate invitation email
    const emailContent = registrationInvitationEmail(member, invitationLink)

    // Send email
    const emailResult = await sendEmail({
      to: member.primary_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      tags: [
        { name: 'category', value: 'registration-invitation' },
        { name: 'member_id', value: memberId },
      ],
    })

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error)
      return NextResponse.json({
        success: false,
        error: 'Failed to send invitation email',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation email sent successfully',
    })
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
