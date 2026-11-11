import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { destinationFromNext, safeRedirectPath } from '@/lib/auth/redirect'

/**
 * Where every sign-in lands. Three shapes arrive here:
 *
 * 1. `?token_hash=…&type=email&next=…` — the sign-in email. Verified on the
 *    SERVER, so the link works on any device: request it on a laptop, open it
 *    on a phone. This is what the email template sends (see
 *    `supabase/auth-config.ts`); it is the normal path for members.
 *
 * 2. `?code=…` — Google sign-in, and any sign-in email sent before the template
 *    changed. A PKCE exchange, which only works in the browser that started it.
 *
 * 3. Neither — an older link that carries the session in the URL hash, which a
 *    server never sees. Handed to `/auth/callback-handler` in the browser.
 *
 * The destination is always run through `safeRedirectPath`: it comes from the
 * query string, so without that a crafted link could finish a genuine sign-in
 * and then send the member to another site.
 *
 * Nothing here logs the URL — it carries one-time credentials.
 */

const EMAIL_OTP_TYPES: EmailOtpType[] = ['email', 'magiclink', 'signup', 'invite', 'recovery', 'email_change']

function toLogin(origin: string, message: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, origin))
}

async function trackLogin(request: Request, origin: string, loginMethod: 'magic_link' | 'google') {
  try {
    const res = await fetch(`${origin}/api/login-tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
        'x-real-ip': request.headers.get('x-real-ip') || '',
        'user-agent': request.headers.get('user-agent') || '',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ loginMethod, success: true }),
    })
    if (!res.ok) console.warn('[auth/callback] login tracking failed:', res.status)
  } catch (err) {
    // Never fail a sign-in because tracking failed.
    console.warn('[auth/callback] login tracking error:', err instanceof Error ? err.message : err)
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const code = url.searchParams.get('code')

  // 1. Sign-in email (any device).
  if (tokenHash) {
    if (!type || !EMAIL_OTP_TYPES.includes(type)) return toLogin(origin, 'That sign-in link is not valid.')
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) {
      console.warn('[auth/callback] verifyOtp failed:', error.message)
      return toLogin(origin, 'That sign-in link has expired or was already used. Request a new one below.')
    }
    await trackLogin(request, origin, 'magic_link')
    return NextResponse.redirect(new URL(destinationFromNext(url.searchParams.get('next'), origin), origin))
  }

  const destination = safeRedirectPath(url.searchParams.get('redirect'))

  // 2. Google, or a pre-template sign-in email.
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.session) {
      console.warn('[auth/callback] code exchange failed:', error?.message ?? 'no session')
      return toLogin(
        origin,
        'Sign-in could not be completed. If you opened an emailed link on a different device or browser, request a new link from there.'
      )
    }
    await trackLogin(request, origin, 'google')
    return NextResponse.redirect(new URL(destination, origin))
  }

  // 3. Session in the URL hash: only the browser can read it.
  //
  // The target is embedded with JSON.stringify and "<" escaped — never by
  // pasting into a quoted string. encodeURIComponent leaves "'" alone, so the
  // previous version let `?redirect=/';alert(1)//` run script on this origin.
  const handler = `/auth/callback-handler?redirect=${encodeURIComponent(destination)}`
  const target = JSON.stringify(handler).replace(/</g, '\\u003c')
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <title>Completing sign in…</title>
  <script>window.location.replace(${target} + window.location.hash);</script>
</head>
<body><p>Completing sign in…</p></body>
</html>`
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  })
}
