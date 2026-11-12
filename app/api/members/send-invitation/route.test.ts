import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fakes: the signed-in caller, whether they hold a staff role, the member row,
// and the mailer.
let caller: { id: string } | null
let staff: boolean
let member: { id: string; primary_email: string } | null
const sendEmail = vi.fn(async (_: unknown) => ({ success: true }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: caller }, error: null }) },
    from: () => {
      const q: any = {
        select: () => q,
        eq: () => q,
        single: async () => ({ data: member, error: member ? null : { code: 'PGRST116' } }),
      }
      return q
    },
  }),
}))
vi.mock('@/lib/auth/helpers', () => ({ isStaff: async () => staff }))
vi.mock('@/lib/email/mailer', () => ({ sendEmail: (m: unknown) => sendEmail(m) }))
vi.mock('@/lib/email/templates', () => ({
  portalLoginLink: (e: string) => `https://example.org/login?email=${e}`,
  registrationInvitationEmail: () => ({ subject: 'Invitation', html: '<p>Join</p>', text: 'Join' }),
}))

const { POST } = await import('./route')
const req = (body: unknown) =>
  new Request('https://member.hsnef.org/api/members/send-invitation', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as any

beforeEach(() => {
  caller = { id: 'staff-1' }
  staff = true
  member = { id: 'm-1', primary_email: 'member@example.org' }
  sendEmail.mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('/api/members/send-invitation', () => {
  it('refuses a caller who is not signed in, and sends nothing', async () => {
    caller = null
    expect((await POST(req({ memberId: 'm-1' }))).status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('refuses a signed-in member without a staff role, and sends nothing', async () => {
    staff = false
    expect((await POST(req({ memberId: 'm-1' }))).status).toBe(403)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown member', async () => {
    member = null
    expect((await POST(req({ memberId: 'nope' }))).status).toBe(404)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('sends the invitation to the member when staff ask', async () => {
    const res = await POST(req({ memberId: 'm-1' }))
    expect(res.status).toBe(200)
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'member@example.org', subject: 'Invitation' }))
  })
})
