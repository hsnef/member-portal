import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Route to record terms acceptance with server-side IP address
 *
 * POST /api/accept-terms
 * Body: {
 *   termsVersion: string
 *   termsContentId: string
 *   memberId?: string
 *   acceptanceMethod: 'registration' | 'first_login' | 'forced_update'
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
    const { termsVersion, termsContentId, memberId, acceptanceMethod } = body

    if (!termsVersion || !termsContentId || !acceptanceMethod) {
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

    // Record acceptance
    const { error: insertError } = await supabase
      .from('terms_acceptances')
      .insert({
        auth_user_id: user.id,
        member_id: memberId || null,
        terms_version: termsVersion,
        terms_content_id: termsContentId,
        ip_address: ipAddress,
        user_agent: userAgent,
        acceptance_method: acceptanceMethod,
      })

    if (insertError) {
      console.error('Error recording terms acceptance:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      })
      return NextResponse.json(
        {
          error: 'Failed to record acceptance',
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ipAddress, // Return for confirmation
    })

  } catch (error) {
    console.error('Terms acceptance API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
