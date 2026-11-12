import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fakes: the signed-in caller, whether they hold a staff role, the booking the
// caller can see (row-level security decides that in the real database), and
// the mailer.
let caller: { id: string } | null
let staff: boolean
let booking: Record<string, unknown> | null
const sendEmail = vi.fn(async (_: unknown) => ({ success: true }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: caller }, error: null }) },
    from: (table: string) => {
      const q: any = {
        select: () => q,
        eq: () => (table === 'service_booking_items' ? Promise.resolve({ data: [], error: null }) : q),
        single: async () => ({ data: booking, error: booking ? null : { code: 'PGRST116' } }),
      }
      return q
    },
  }),
}))
vi.mock('@/lib/auth/helpers', () => ({ isStaff: async () => staff }))
vi.mock('@/lib/email/mailer', () => ({ sendEmail: (m: unknown) => sendEmail(m) }))
vi.mock('@/lib/email/templates', () => ({
  bookingConfirmationEmail: () => ({ subject: 'Confirmed', html: '<p>ok</p>', text: 'ok' }),
}))

const { POST } = await import('./route')
const req = (body: unknown) =>
  new Request('https://member.hsnef.org/api/bookings/send-notification', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as any

beforeEach(() => {
  caller = { id: 'member-1' }
  staff = false
  booking = { id: 'b-1234567890', requester_name: 'A Member', requester_email: 'member@example.org', total_amount: 51 }
  sendEmail.mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('/api/bookings/send-notification', () => {
  it('refuses a caller who is not signed in, and sends nothing', async () => {
    caller = null
    expect((await POST(req({ bookingId: 'b-1', status: 'submitted' }))).status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('lets a member send the "submitted" email for their own booking', async () => {
    expect((await POST(req({ bookingId: 'b-1', status: 'submitted' }))).status).toBe(200)
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'member@example.org' }))
  })

  it('refuses a member sending an approval (payment link) email', async () => {
    expect((await POST(req({ bookingId: 'b-1', status: 'Approved' }))).status).toBe(403)
    expect((await POST(req({ bookingId: 'b-1', status: 'Confirmed' }))).status).toBe(403)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('lets staff send the approval email', async () => {
    staff = true
    expect((await POST(req({ bookingId: 'b-1', status: 'Approved' }))).status).toBe(200)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('returns 404 for a booking the caller cannot see', async () => {
    booking = null
    expect((await POST(req({ bookingId: 'someone-elses', status: 'submitted' }))).status).toBe(404)
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
