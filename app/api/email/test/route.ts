// ============================================================================
// Test Email API Route
// ============================================================================
// Test your Google Workspace SMTP configuration
// Only accessible in development mode

import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail, verifyEmailConnection } from '@/lib/email/mailer'

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    )
  }

  // Get email from query params
  const searchParams = request.nextUrl.searchParams
  const to = searchParams.get('to')

  if (!to) {
    return NextResponse.json(
      {
        error: 'Missing "to" parameter',
        usage: 'GET /api/email/test?to=your-email@example.com'
      },
      { status: 400 }
    )
  }

  try {
    // First verify connection
    const verification = await verifyEmailConnection()
    if (!verification.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMTP connection failed',
          details: verification.error
        },
        { status: 500 }
      )
    }

    // Send test email
    const result = await sendTestEmail(to)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
