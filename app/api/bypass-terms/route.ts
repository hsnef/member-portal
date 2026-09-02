import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Route to record terms acceptance bypass
 * Called when user encounters repeated errors and needs to bypass
 *
 * POST /api/bypass-terms
 * Body: {
 *   termsVersion: string
 *   termsContentId: string
 *   memberId?: string
 *   errorMessage: string
 *   retryCount: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { termsVersion, termsContentId, memberId, errorMessage, retryCount } = body

    if (!termsVersion || !termsContentId || !errorMessage || retryCount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get IP address from request headers (server-side)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || request.ip || 'unknown'

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Record bypass
    const { error: insertError } = await supabase
      .from('terms_acceptance_bypasses')
      .insert({
        auth_user_id: user.id,
        member_id: memberId || null,
        terms_version: termsVersion,
        terms_content_id: termsContentId,
        error_message: errorMessage,
        retry_count: retryCount,
        ip_address: ipAddress,
        user_agent: userAgent,
        should_reprompt: true,
        resolved: false,
      })

    if (insertError) {
      console.error('Error recording bypass:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      })
      return NextResponse.json(
        {
          error: 'Failed to record bypass',
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        },
        { status: 500 }
      )
    }

    // Log for admin notification
    console.warn(`⚠️ Terms acceptance bypass recorded for user ${user.email} after ${retryCount} failed attempts`)

    return NextResponse.json({
      success: true,
      message: 'Bypass recorded successfully',
    })

  } catch (error) {
    console.error('Bypass API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
