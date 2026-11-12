import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/mailer'
import { welcomeEmail } from '@/lib/email/templates'
import { isStaff } from '@/lib/auth/helpers'

/**
 * `/api/members/send-welcome` — send a member the welcome email.
 * Staff only (Office Staff, Office Manager, Admin): it emails a member on the
 * temple's behalf, so a signed-out caller or a plain member is refused.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await isStaff())) {
      return NextResponse.json({ error: 'Only office staff can send welcome emails' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const memberId = typeof body?.memberId === 'string' ? body.memberId : ''
    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
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

    // Generate welcome email
    const emailContent = welcomeEmail(member)

    // Send email
    const emailResult = await sendEmail({
      to: member.primary_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      tags: [
        { name: 'category', value: 'welcome' },
        { name: 'member_id', value: memberId },
      ],
    })

    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error)
      return NextResponse.json({
        success: false,
        error: 'Failed to send welcome email',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
