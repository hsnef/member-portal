import { beforeEach, describe, expect, it, vi } from 'vitest'

// A minimal fake of the Supabase service client: each table returns what the
// test sets, and every insert is recorded.
type Result = { data: unknown; error: unknown }
let existingMembers: unknown[]
let approvalSetting: unknown
let memberInsertResult: Result
let pendingInsertError: unknown
const inserts: Record<string, unknown[]> = {}

function table(name: string) {
  const q: Record<string, unknown> = {}
  const chain = () => q
  Object.assign(q, {
    select: chain,
    eq: chain,
    ilike: chain,
    limit: async () => ({ data: name === 'members' ? existingMembers : [], error: null }),
    maybeSingle: async () => ({ data: approvalSetting, error: null }),
    insert: (row: unknown) => {
      ;(inserts[name] ??= []).push(row)
      if (name === 'pending_member_registrations') return Promise.resolve({ error: pendingInsertError })
      if (name === 'terms_acceptances') return Promise.resolve({ error: null })
      return { select: () => ({ single: async () => memberInsertResult }) }
    },
  })
  return q
}

vi.mock('@/lib/supabase/client', () => ({
  createServiceClient: () => ({ from: table }),
}))

const sendEmail = vi.fn()
vi.mock('@/lib/email/mailer', () => ({ sendEmail: (o: unknown) => sendEmail(o) }))

const sendOfficeAlert = vi.fn(async (_db: unknown, _alert: unknown) => true)
vi.mock('@/lib/notify/office', () => ({ sendOfficeAlert: (db: unknown, a: unknown) => sendOfficeAlert(db, a) }))

const { POST } = await import('./route')

const application = {
  memberClass: 'Personal',
  requestedLevel: 'Community',
  firstName: 'Asha',
  lastName: 'Rao',
  primaryEmail: 'asha@example.org',
  howDidYouHear: 'Website',
  termsAccepted: true,
  termsVersion: '1.0',
  termsContentId: '1b4e28ba-2fa1-11d2-883f-0016d3cca427',
}

const post = (body: unknown) =>
  POST(new Request('https://member.hsnef.org/api/join', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }))

beforeEach(() => {
  existingMembers = []
  approvalSetting = { setting_value: { enabled: true } }
  sendOfficeAlert.mockClear()
  memberInsertResult = {
    data: { id: 'm1', membership_id: '30001200', primary_email: 'asha@example.org',
      first_name: 'Asha', last_name: 'Rao', current_level: 'Community' },
    error: null,
  }
  pendingInsertError = null
  for (const k of Object.keys(inserts)) delete inserts[k]
  sendEmail.mockReset().mockResolvedValue({ success: true })
})

describe('POST /api/join', () => {
  it('approval ON: files the application for the office, creates no member', async () => {
    const res = await post(application)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ status: 'pending' })
    expect(inserts.pending_member_registrations).toHaveLength(1)
    expect(inserts.pending_member_registrations[0]).toMatchObject({
      primary_email: 'asha@example.org', how_did_you_hear: 'Website', terms_accepted: true,
    })
    expect(inserts.members).toBeUndefined()
    expect(sendEmail).not.toHaveBeenCalled()
    // The office alert list hears about it, with a link to the approvals page.
    expect(sendOfficeAlert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        subject: 'New application: Asha Rao',
        link: expect.objectContaining({ path: '/admin/pending-registrations' }),
      }),
    )
  })

  it('approval OFF: creates the member without a membership_id, records terms, sends the welcome email', async () => {
    approvalSetting = { setting_value: { enabled: false } }
    const res = await post(application)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ status: 'created', membershipId: '30001200' })
    expect(inserts.members).toHaveLength(1)
    expect(inserts.members[0]).not.toHaveProperty('membership_id')
    expect(inserts.members[0]).not.toHaveProperty('how_did_you_hear')
    expect(inserts.terms_acceptances).toHaveLength(1)
    expect(inserts.pending_member_registrations).toBeUndefined()
    expect(sendEmail).toHaveBeenCalledOnce()
    expect(sendEmail.mock.calls[0][0].html).toContain('/login?email=asha%40example.org')
  })

  it('treats a missing setting as approval ON, never as auto-accept', async () => {
    approvalSetting = null
    expect(await (await post(application)).json()).toEqual({ status: 'pending' })
    expect(inserts.members).toBeUndefined()
  })

  it('still reports success when the welcome email fails: the member exists', async () => {
    approvalSetting = { setting_value: { enabled: false } }
    sendEmail.mockResolvedValue({ success: false, error: 'smtp down' })
    expect((await post(application)).status).toBe(201)
  })

  it('refuses an invalid payload without touching the database', async () => {
    const res = await post({ ...application, termsAccepted: false })
    expect(res.status).toBe(400)
    expect(Object.keys(inserts)).toHaveLength(0)
  })

  it('refuses a body that is not JSON', async () => {
    expect((await post('not json')).status).toBe(400)
  })

  it('refuses an address that already has a membership, and says to sign in', async () => {
    existingMembers = [{ id: 'm0' }]
    const res = await post(application)
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('already-member')
    expect(Object.keys(inserts)).toHaveLength(0)
  })

  it('returns 500 with a plain message when the insert fails', async () => {
    pendingInsertError = { message: 'boom' }
    const res = await post(application)
    expect(res.status).toBe(500)
    expect((await res.json()).error).not.toMatch(/boom/)
  })
})
