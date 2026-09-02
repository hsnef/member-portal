import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-side callback handler for OAuth and magic links
 * - OAuth uses ?code= parameter (exchanged server-side)
 * - Magic links may use hash fragments (handled client-side via redirect)
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/member'

  // Decode redirect if it was double-encoded
  const decodedRedirect = decodeURIComponent(redirect)

  console.log('[Auth Callback] URL:', requestUrl.toString())
  console.log('[Auth Callback] Code:', code ? 'present' : 'absent')
  console.log('[Auth Callback] Redirect:', decodedRedirect)

  // If no code, this might be a magic link (hash fragments are client-side only)
  // Return an HTML page that will handle the hash fragments client-side
  if (!code) {
    console.log('[Auth Callback] No code - redirecting to client-side handler for hash fragments')
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Completing sign in...</title>
  <script>
    // Debug logging
    console.log('[Auth Callback HTML] Hash:', window.location.hash);
    console.log('[Auth Callback HTML] Full URL:', window.location.href);

    // If hash exists, append it to the redirect URL
    if (window.location.hash) {
      console.log('[Auth Callback HTML] Redirecting with hash');
      window.location.href = '/auth/callback-handler?redirect=${encodeURIComponent(decodedRedirect)}' + window.location.hash;
    } else {
      console.log('[Auth Callback HTML] No hash found, redirecting anyway');
      window.location.href = '/auth/callback-handler?redirect=${encodeURIComponent(decodedRedirect)}';
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
