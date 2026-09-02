import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'

/**
 * Decides whether an email address is allowed to request a sign-in link.
 *
 * Why this exists: `signInWithOtp` defaults to `shouldCreateUser: true`, so
 * before this route the login page minted a real auth account for ANY address
 * typed into it. Those accounts can never be linked to a membership — the
 * office creates member records, not the portal — so they landed in a portal
 * with no data and no way forward.
 *
 * Two arms, and both are needed:
 *
 *   1. A member record exists for the address. This is the normal first-time
 *      sign-in: the office has created the row, `auth_user_id` is still null,
 *      and the auth account is created by the magic link itself. Gating on the
 *      auth account alone would lock every genuine new member out.
 *
 *   2. An auth account already exists for the address. This covers staff and
 *      historical accounts that hold no member row of their own, which would
 *      otherwise be locked out of a portal they can already use.
 *
 * This is deliberately an enumeration oracle: it tells a caller whether an
 * address is known to the temple. That was accepted as the cost of not
 * stranding people in an unusable account. It is also only a client-side gate
 * — a determined caller can still reach Supabase directly. Closing that needs
 * a Supabase-side auth hook, which is dashboard configuration, not code.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const raw = typeof body?.email === 'string' ? body.email : ''
    const email = raw.trim().toLowerCase()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ allowed: false, reason: 'invalid' }, { status: 400 })
    }

    const service = createServiceClient()

    // Arm 1 — a member record on either the primary or the secondary address.
    // `ilike` rather than `eq` because addresses were entered by hand over
    // years of imports and their casing is not consistent.
    const { data: memberMatch } = await service
      .from('members')
      .select('id')
      .or(`primary_email.ilike.${email},secondary_email.ilike.${email}`)
      .limit(1)

    if (memberMatch && memberMatch.length > 0) {
      return NextResponse.json({ allowed: true, reason: 'member' })
    }

    // Arm 2 — an existing auth account. Queried through GoTrue's admin
    // endpoint with a `filter`, NOT `listUsers()`: that helper pages at 50 and
    // would quietly stop finding accounts once the project outgrows one page.
    // `filter` is a partial match, so the addresses are compared exactly here
    // rather than trusting the hit.
    const adminUrl =
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users` +
      `?filter=${encodeURIComponent(email)}&per_page=50`
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const adminRes = await fetch(adminUrl, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    })
    const adminBody = adminRes.ok
      ? ((await adminRes.json()) as { users?: Array<{ email?: string }> })
      : null
    const hasAuthUser = adminBody?.users?.some(
      (u) => (u.email ?? '').toLowerCase() === email
    )

    if (hasAuthUser) {
      return NextResponse.json({ allowed: true, reason: 'existing-account' })
    }

    return NextResponse.json({ allowed: false, reason: 'unknown' })
  } catch (error) {
    // Fail open rather than closed. A broken lookup must not become an
    // outage that locks every member out of the portal; the worst case is
    // the pre-existing behaviour of an unlinked account.
    console.error('[check-member-email] lookup failed:', error)
    return NextResponse.json({ allowed: true, reason: 'check-failed' })
  }
}
