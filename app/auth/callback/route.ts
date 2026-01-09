import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-side callback handler for OAuth (uses ?code= parameter)
 * Magic links use hash fragments (#access_token=...) which are handled by client-side redirect
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/admin'

  // If no code, this might be a magic link (hash fragments are client-side only)
  // Return an HTML page that will handle the hash fragments client-side
  if (!code) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Completing sign in...</title>
  <meta http-equiv="refresh" content="0;url=/auth/callback-handler?redirect=${encodeURIComponent(redirect)}">
  <script>
    // If hash exists, append it to the redirect URL
    if (window.location.hash) {
      window.location.href = '/auth/callback-handler?redirect=${encodeURIComponent(redirect)}' + window.location.hash;
    } else {
      window.location.href = '/auth/callback-handler?redirect=${encodeURIComponent(redirect)}';
    }
  </script>
</head>
<body>
  <p>Completing sign in...</p>
</body>
</html>
    `
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const supabase = await createClient()

  // Handle OAuth callback (has code parameter)
  console.log('OAuth callback - exchanging code for session')
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
    )
  }

  if (!data.session) {
    console.error('No session after OAuth exchange')
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Failed to establish session')}`, requestUrl.origin)
    )
  }

  console.log('OAuth session established successfully')

  // Track successful Google OAuth login
  try {
    const trackingResponse = await fetch(`${requestUrl.origin}/api/login-tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
        'x-real-ip': request.headers.get('x-real-ip') || '',
        'user-agent': request.headers.get('user-agent') || '',
        'Cookie': request.headers.get('cookie') || '', // Pass cookies for auth
      },
      body: JSON.stringify({
        loginMethod: 'google',
        success: true,
      }),
    })

    if (!trackingResponse.ok) {
      console.warn('Failed to track login activity:', await trackingResponse.text())
    }
  } catch (trackingError) {
    // Don't fail the login if tracking fails
    console.warn('Login tracking error:', trackingError)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(redirect, requestUrl.origin))
}
