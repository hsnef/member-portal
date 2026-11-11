/**
 * Sign-in accounts for staff, through Supabase's auth admin API.
 *
 * Staff roles live on the SIGN-IN account (`user_roles.user_id` → auth.users),
 * not on a member record. An Admin like gsujit@gmail.com has no membership at
 * all. The Staff roles page used to find people through `members`, so it could
 * neither list such staff nor give anyone a role before they had a membership
 * AND had signed in once (found 2026-11-11). These helpers let it work from an
 * email address instead.
 *
 * Server-only: they use the service-role key.
 */

export { isStaffRole, type StaffRole } from './staffRules'

function adminFetch(path: string, init?: RequestInit) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

export interface AuthAccount {
  id: string
  email: string
}

/**
 * The account with exactly this address, or null. GoTrue's `filter` is a
 * partial match, so the result is compared exactly here (same approach as
 * /api/auth/check-member-email). Throws if the lookup itself fails, so a
 * fault is never mistaken for "no such account".
 */
export async function findAccountByEmail(email: string): Promise<AuthAccount | null> {
  const res = await adminFetch(`/users?filter=${encodeURIComponent(email)}&per_page=50`)
  if (!res.ok) throw new Error(`Account lookup failed (${res.status})`)
  const body = (await res.json()) as { users?: Array<{ id: string; email?: string }> }
  const hit = body.users?.find((u) => (u.email ?? '').toLowerCase() === email)
  return hit ? { id: hit.id, email } : null
}

/**
 * Create a sign-in account for a new staff member. The address is marked
 * confirmed: an Admin vouched for it, and the person proves they own it the
 * first time they use a sign-in link, which only that mailbox receives.
 */
export async function createAccount(email: string): Promise<AuthAccount> {
  const res = await adminFetch('/users', {
    method: 'POST',
    body: JSON.stringify({ email, email_confirm: true }),
  })
  if (!res.ok) throw new Error(`Account creation failed (${res.status})`)
  const user = (await res.json()) as { id: string }
  return { id: user.id, email }
}

/** Email addresses for the given account ids (for the staff list). */
export async function emailsForAccounts(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  await Promise.all(
    ids.map(async (id) => {
      const res = await adminFetch(`/users/${id}`)
      if (!res.ok) return
      const user = (await res.json()) as { email?: string }
      if (user.email) out[id] = user.email
    })
  )
  return out
}
