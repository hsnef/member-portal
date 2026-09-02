import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Route to track login activity with IP address, geolocation, and user agent
 *
 * POST /api/login-tracking
 * Body: {
 *   loginMethod: 'google' | 'magic_link' | 'email' | 'registration' | 'session_restored'
 *   success: boolean
 *   failureReason?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user (optional for failed logins)
    const { data: { user } } = await supabase.auth.getUser()

    // Get request body
    const body = await request.json()
    const { loginMethod, success, failureReason } = body

    if (!loginMethod || success === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: loginMethod and success' },
        { status: 400 }
      )
    }

    // Get IP address from request headers (server-side)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || request.ip || null

    // Get user agent
    const userAgent = request.headers.get('user-agent') || null

    // Get geolocation data from IP address
    let geoCountry = null
    let geoCity = null

    if (ipAddress && ipAddress !== 'unknown' && !ipAddress.includes('127.0.0.1') && !ipAddress.includes('localhost')) {
      try {
        // Use ip-api.com for free geolocation (no API key required)
        // Rate limit: 45 requests per minute
        const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,city`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        })

        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          if (geoData.status === 'success') {
            geoCountry = geoData.country
            geoCity = geoData.city
          }
        }
      } catch (geoError) {
        // Silently fail geolocation - not critical
        console.warn('Geolocation lookup failed:', geoError)
      }
    }

    // Get member_id from members table using auth_user_id
    let memberId = null
    if (user?.id) {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      memberId = member?.id || null
    }

    // Insert login activity log
    const { error: insertError } = await supabase
      .from('login_audit_logs')
      .insert({
        auth_user_id: user?.id || null,
        member_id: memberId,
        login_method: loginMethod,
        ip_address: ipAddress,
        user_agent: userAgent,
        geo_country: geoCountry,
        geo_city: geoCity,
        success,
        failure_reason: failureReason || null,
      })

    if (insertError) {
      console.error('Error recording login activity:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      })
      return NextResponse.json(
        {
          error: 'Failed to record login activity',
          message: insertError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tracked: {
        loginMethod,
        ipAddress,
        location: geoCity && geoCountry ? `${geoCity}, ${geoCountry}` : geoCountry || 'Unknown',
      },
    })

  } catch (error) {
    console.error('Login tracking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
