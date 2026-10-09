/**
 * Where to send someone after they sign in.
 *
 * The destination arrives in a query string (`?redirect=` on our callback, or
 * `next=` from the sign-in email), so it is attacker-controllable. Without a
 * check, a crafted sign-in link could complete a genuine sign-in and then hand
 * the member to another site. Only same-site paths are allowed; anything else
 * falls back to the default.
 */

export const DEFAULT_AFTER_SIGN_IN = '/member'

/**
 * Returns `raw` if it is a same-site path ("/member/pass?x=1"), else `fallback`.
 * Rejects absolute URLs, protocol-relative ("//evil"), backslash tricks
 * ("/\\evil" — browsers treat "\" as "/"), and control characters.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = DEFAULT_AFTER_SIGN_IN): string {
  if (!raw) return fallback
  let value = raw.trim()
  // Accept one level of encoding ("%2Fmember"), as the login page encodes it.
  if (/^%2f/i.test(value)) {
    try {
      value = decodeURIComponent(value)
    } catch {
      return fallback
    }
  }
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback
  // Never loop back into the auth flow itself.
  if (value === '/login' || value.startsWith('/login?') || value.startsWith('/auth/')) return fallback
  return value
}

/**
 * The destination carried by a sign-in email's `next` parameter.
 *
 * The email template passes Supabase's `{{ .RedirectTo }}`, which is the full
 * `emailRedirectTo` URL the login page asked for — normally
 * `<origin>/auth/callback?redirect=/member`. Only its path matters, and only
 * when it is on this site.
 */
export function destinationFromNext(next: string | null | undefined, siteOrigin: string): string {
  if (!next) return DEFAULT_AFTER_SIGN_IN
  if (next.startsWith('/')) return safeRedirectPath(next)
  let url: URL
  try {
    url = new URL(next)
  } catch {
    return DEFAULT_AFTER_SIGN_IN
  }
  if (url.origin !== siteOrigin) return DEFAULT_AFTER_SIGN_IN
  if (url.pathname === '/auth/callback') return safeRedirectPath(url.searchParams.get('redirect'))
  return safeRedirectPath(url.pathname + url.search)
}
