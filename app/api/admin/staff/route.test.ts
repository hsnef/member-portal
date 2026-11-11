import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fakes: the signed-in caller, user_roles rows, and the auth admin helpers.
let caller: { id: string } | null
let roleRows: Array<{ user_id: string; role: string }>
let insertError: { code?: string } | null
const inserted: unknown[] = []
const deleted: unknown[] = []
let existingAccount: { id: string; email: string } | null

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: caller } }) } }),
}))

function userRoles() {
  const filters: Record<string, unknown> = {}
  const q: any = {
    select: () => q,
    eq: (col: string, v: unknown) => {
      filters[col] = v
      if (q._deleting) {
        if (Object.keys(filters).length === 2) { deleted.push({ ...filters }); return Promise.resolve({ error: null }) }
        return q
      }
      return Promise.resolve({ data: roleRows.filter((r) => r.user_id === v), error: null })
    },
    in: () => Promise.resolve({ data: roleRows, error: null }),
    insert: (row: unknown) => { inserted.push(row); return Promise.resolve({ error: insertError }) },
    delete: () => { q._deleting = true; return q },
  }
  return q
}
function members() {
  const q: any = { select: () => q, in: () => Promise.resolve({ data: [], error: null }) }
  return q
}
vi.mock('@/lib/supabase/client', () => ({
  createServiceClient: () => ({ from: (t: string) => (t === 'user_roles' ? userRoles() : members()) }),
}))

const createAccount = vi.fn(async (email: string) => ({ id: 'new-user', email }))
vi.mock('@/lib/admin/staffAccounts', () => ({
  findAccountByEmail: async () => existingAccount,
  createAccount: (e: string) => createAccount(e),
  emailsForAccounts: async (ids: string[]) => Object.fromEntries(ids.map((id) => [id, `${id}@example.org`])),
}))

const { GET, POST, DELETE } = await import('./route')
const req = (method: string, body?: unknown) =>
  new Request('https://member.hsnef.org/api/admin/staff', { method, body: body ? JSON.stringify(body) : undefined })

beforeEach(() => {
  caller = { id: 'admin-1' }
  roleRows = [{ user_id: 'admin-1', role: 'Admin' }]
  insertError = null
  inserted.length = 0
  deleted.length = 0
  existingAccount = null
  createAccount.mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('/api/admin/staff', () => {
  it('refuses anyone who is not an Admin', async () => {
    roleRows = [{ user_id: 'admin-1', role: 'Office Manager' }]
    expect((await GET()).status).toBe(403)
    expect((await POST(req('POST', { email: 'x@example.org', role: 'Admin' }))).status).toBe(403)
  })

  it('refuses a caller who is not signed in', async () => {
    caller = null
    expect((await GET()).status).toBe(401)
  })

  it('lists staff who have no membership', async () => {
    const body = await (await GET()).json()
    expect(body.staff).toEqual([
      expect.objectContaining({ user_id: 'admin-1', email: 'admin-1@example.org', membership_id: null, roles: ['Admin'] }),
    ])
  })

  it('creates a sign-in account for a new address and gives it the role', async () => {
    const res = await POST(req('POST', { email: ' New.Admin@Example.org ', role: 'Admin' }))
    expect(res.status).toBe(201)
    expect((await res.json()).status).toBe('created')
    expect(createAccount).toHaveBeenCalledWith('new.admin@example.org')
    expect(inserted).toEqual([{ user_id: 'new-user', role: 'Admin' }])
  })

  it('uses the existing account when there is one', async () => {
    existingAccount = { id: 'u7', email: 'staff@example.org' }
    const res = await POST(req('POST', { email: 'staff@example.org', role: 'Office Staff' }))
    expect((await res.json()).status).toBe('granted')
    expect(createAccount).not.toHaveBeenCalled()
    expect(inserted).toEqual([{ user_id: 'u7', role: 'Office Staff' }])
  })

  it('says so when they already hold the role', async () => {
    existingAccount = { id: 'u7', email: 'staff@example.org' }
    insertError = { code: '23505' }
    expect((await POST(req('POST', { email: 'staff@example.org', role: 'Admin' }))).status).toBe(409)
  })

  it('rejects a bad email or a non-staff role', async () => {
    expect((await POST(req('POST', { email: 'nope', role: 'Admin' }))).status).toBe(400)
    expect((await POST(req('POST', { email: 'a@example.org', role: 'Member' }))).status).toBe(400)
  })

  it('will not remove the last Admin', async () => {
    const res = await DELETE(req('DELETE', { userId: 'admin-1', role: 'Admin' }))
    expect(res.status).toBe(409)
    expect(deleted).toHaveLength(0)
  })

  it('removes a role when another Admin remains', async () => {
    roleRows = [
      { user_id: 'admin-1', role: 'Admin' },
      { user_id: 'admin-2', role: 'Admin' },
    ]
    const res = await DELETE(req('DELETE', { userId: 'admin-2', role: 'Admin' }))
    expect(res.status).toBe(200)
    expect(deleted).toEqual([{ user_id: 'admin-2', role: 'Admin' }])
  })
})
