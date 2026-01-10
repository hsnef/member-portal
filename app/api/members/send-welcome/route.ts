import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/mailer'
import { welcomeEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { memberId } = await request.json()

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
