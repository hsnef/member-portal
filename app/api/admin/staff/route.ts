import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/client'
import { normaliseEmail } from '@/lib/auth/memberEmail'
import { createAccount, emailsForAccounts, findAccountByEmail } from '@/lib/admin/staffAccounts'
import { isStaffRole, wouldRemoveLastAdmin } from '@/lib/admin/staffRules'

/**
 * `/api/admin/staff` — the Staff roles page (`/admin/settings/staff-roles`).
 * Admin only, checked here as well as by the page.
 *
 *   GET    → everyone holding a staff role, with or without a membership.
 *   POST   { email, role } → find or create that person's sign-in account and
 *          give it the role. No membership needed: Admins and staff need not
 *          be members. They then sign in with a link like everyone else.
 *   DELETE { userId, role } → remove a role, refusing to remove the last
 *          non-test Admin.
 */

type AdminCheck =
  | { ok: false; response: NextResponse }
  | { ok: true; service: ReturnType<typeof createServiceClient> }

async function requireAdmin(): Promise<AdminCheck> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, response: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) }

  const service = createServiceClient()
  const { data: roles } = await service.from('user_roles').select('role').eq('user_id', user.id)
  if (!roles?.some((r: { role: string }) => r.role === 'Admin')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Only an Admin can manage staff roles' }, { status: 403 }),
    }
  }
  return { ok: true, service }
}

type Service = ReturnType<typeof createServiceClient>

async function listStaff(service: Service) {
  const { data: roleRows, error } = await service
    .from('user_roles')
    .select('user_id, role')
    .in('role', ['Admin', 'Office Manager', 'Office Staff'])
  if (error) throw error

  const rolesByUser: Record<string, string[]> = {}
  for (const r of (roleRows ?? []) as Array<{ user_id: string; role: string }>) {
    ;(rolesByUser[r.user_id] ??= []).push(r.role)
  }
  const ids = Object.keys(rolesByUser)
  if (ids.length === 0) return []

  const [{ data: members }, emails] = await Promise.all([
    service
      .from('members')
      .select('auth_user_id, membership_id, first_name, last_name, is_test_account')
      .in('auth_user_id', ids),
    emailsForAccounts(ids),
  ])
  const memberByUser: Record<string, any> = {}
  for (const m of (members ?? []) as any[]) memberByUser[m.auth_user_id] = m

  return ids
    .map((id) => {
      const m = memberByUser[id]
      const name = m ? [m.first_name, m.last_name].filter(Boolean).join(' ') : ''
      return {
        user_id: id,
        email: emails[id] ?? '',
        name,
        membership_id: m?.membership_id ?? null,
        is_test_account: Boolean(m?.is_test_account),
        roles: rolesByUser[id],
      }
    })
    .sort((a, b) => {
      const aAdmin = a.roles.includes('Admin') ? 0 : 1
      const bAdmin = b.roles.includes('Admin') ? 0 : 1
      return aAdmin - bAdmin || (a.name || a.email).localeCompare(b.name || b.email)
    })
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  try {
    return NextResponse.json({ staff: await listStaff(auth.service) })
  } catch (error) {
    console.error('[admin/staff] list failed:', error)
    return NextResponse.json({ error: 'Could not load staff' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const email = normaliseEmail(body?.email)
  if (!email) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  if (!isStaffRole(body?.role)) return NextResponse.json({ error: 'Choose a role' }, { status: 400 })

  try {
    const existing = await findAccountByEmail(email)
    const account = existing ?? (await createAccount(email))

    const { error } = await auth.service
      .from('user_roles')
      .insert({ user_id: account.id, role: body.role } as never)
    // 23505: they already hold this role. Saying so is enough.
    if (error && (error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: `${email} already has the ${body.role} role` }, { status: 409 })
    }
    if (error) throw error

    return NextResponse.json({ status: existing ? 'granted' : 'created', email, role: body.role }, { status: 201 })
  } catch (error) {
    console.error('[admin/staff] grant failed:', error)
    return NextResponse.json({ error: 'Could not give the role. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const userId = typeof body?.userId === 'string' ? body.userId : ''
  if (!userId || !isStaffRole(body?.role)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const staff = await listStaff(auth.service)
    if (wouldRemoveLastAdmin(staff, userId, body.role)) {
      return NextResponse.json(
        { error: 'This is the only Admin. Give someone else the Admin role first.' },
        { status: 409 }
      )
    }
    const { error } = await auth.service
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', body.role)
    if (error) throw error
    return NextResponse.json({ status: 'removed' })
  } catch (error) {
    console.error('[admin/staff] remove failed:', error)
    return NextResponse.json({ error: 'Could not remove the role. Please try again.' }, { status: 500 })
  }
}
