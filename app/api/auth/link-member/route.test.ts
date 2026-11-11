import { beforeEach, describe, expect, it, vi } from 'vitest'

// The route asks members two things: "linked to this user?" (eq auth_user_id)
// and "unlinked with this email?" (ilike + is null). Each test scripts the
// answers in order, which is how the race is replayed.
let byUser: unknown[][]
let unlinked: unknown[][]
const updates: unknown[] = []

function membersTable() {
  const q: Record<string, unknown> = {}
  let mode: 'byUser' | 'unlinked' | 'update' = 'byUser'
  Object.assign(q, {
    select: () => q,
    update: (v: unknown) => { mode = 'update'; updates.push(v); return q },
    ilike: () => { mode = 'unlinked'; return q },
    is: () => Promise.resolve({ data: unlinked.shift() ?? [], error: null }),
    eq: () => {
      if (mode === 'update') return Promise.resolve({ error: null })
      return Promise.resolve({ data: byUser.shift() ?? [], error: null })
    },
  })
  return q
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1', email: 'New.Member@Example.org' } }, error: null }) },
  }),
}))
vi.mock('@/lib/supabase/client', () => ({
  createServiceClient: () => ({ from: () => membersTable() }),
}))

const { POST } = await import('./route')
const call = () => POST(new Request('https://member.hsnef.org/api/auth/link-member', { method: 'POST' }))
const MEMBER = { id: 'm1', membership_id: '20000100' }

beforeEach(() => {
  byUser = []
  unlinked = []
  updates.length = 0
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('POST /api/auth/link-member', () => {
  it('links an unlinked member with the same email', async () => {
    byUser = [[]]
    unlinked = [[MEMBER]]
    const res = await call()
    expect(res.status).toBe(200)
    expect(updates).toEqual([{ auth_user_id: 'u1' }])
  })

  it('answers success, not 404, when a parallel request linked the member first', async () => {
    // Not linked at the first look, nothing unlinked at the second: the other
    // request got there in between. The re-check finds it linked to this user.
    byUser = [[], [MEMBER]]
    unlinked = [[]]
    const res = await call()
    expect(res.status).toBe(200)
    expect((await res.json()).message).toBe('Already linked')
  })

  it('still answers 404 when there is genuinely no member for the email', async () => {
    byUser = [[], []]
    unlinked = [[]]
    expect((await call()).status).toBe(404)
  })
})
