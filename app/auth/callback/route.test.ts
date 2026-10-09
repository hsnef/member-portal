import { beforeEach, describe, expect, it, vi } from 'vitest'

// The route's only collaborator is the Supabase server client; fake it.
const verifyOtp = vi.fn()
const exchangeCodeForSession = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { verifyOtp, exchangeCodeForSession } }),
}))

const { GET } = await import('./route')

const SITE = 'https://member.hsnef.org'
const call = (qs: string) => GET(new Request(`${SITE}/auth/callback${qs}`))
const location = (res: Response) => new URL(res.headers.get('location')!)

beforeEach(() => {
  verifyOtp.mockReset()
  exchangeCodeForSession.mockReset()
  // Login tracking is fire-and-forget; keep it off the network.
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
})

describe('/auth/callback — sign-in email (token_hash, any device)', () => {
  it('verifies on the server and lands on the destination carried by `next`', async () => {
    verifyOtp.mockResolvedValue({ error: null })
    const next = encodeURIComponent(`${SITE}/auth/callback?redirect=/admin/bookings`)
    const res = await call(`?token_hash=abc&type=email&next=${next}`)
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc', type: 'email' })
    expect(location(res).pathname).toBe('/admin/bookings')
    expect(location(res).origin).toBe(SITE)
  })

  it('sends an expired or reused link back to /login with a plain explanation', async () => {
    verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } })
    const res = await call('?token_hash=abc&type=email')
    expect(location(res).pathname).toBe('/login')
    expect(location(res).searchParams.get('error')).toMatch(/expired or was already used/)
  })

  it('rejects an unknown type without calling Supabase', async () => {
    const res = await call('?token_hash=abc&type=sms')
    expect(verifyOtp).not.toHaveBeenCalled()
    expect(location(res).pathname).toBe('/login')
  })

  it('never follows `next` to another site', async () => {
    verifyOtp.mockResolvedValue({ error: null })
    const res = await call(`?token_hash=abc&type=email&next=${encodeURIComponent('https://evil.example/x')}`)
    expect(location(res).origin).toBe(SITE)
    expect(location(res).pathname).toBe('/member')
  })
})

describe('/auth/callback — code exchange (Google)', () => {
  it('lands on a safe redirect after a good exchange', async () => {
    exchangeCodeForSession.mockResolvedValue({ data: { session: {} }, error: null })
    const res = await call('?code=xyz&redirect=%2Fmember%2Fpass')
    expect(location(res).pathname).toBe('/member/pass')
  })

  it('refuses an open redirect', async () => {
    exchangeCodeForSession.mockResolvedValue({ data: { session: {} }, error: null })
    const res = await call(`?code=xyz&redirect=${encodeURIComponent('https://evil.example')}`)
    expect(location(res).origin).toBe(SITE)
    expect(location(res).pathname).toBe('/member')
  })

  it('explains the different-device case when the exchange fails', async () => {
    exchangeCodeForSession.mockResolvedValue({ data: { session: null }, error: { message: 'code verifier not found' } })
    const res = await call('?code=xyz')
    expect(location(res).searchParams.get('error')).toMatch(/different device/)
  })
})

describe('/auth/callback — hash hand-off page', () => {
  it('cannot be turned into script injection through `redirect`', async () => {
    const res = await call(`?redirect=${encodeURIComponent("/';alert(1)//")}`)
    const html = await res.text()
    // The payload is neutralised by safeRedirectPath AND embedded as JSON.
    expect(html).not.toContain("';alert(1)")
    expect(html).toContain('window.location.replace("/auth/callback-handler?redirect=')
  })

  it('cannot break out of the script element', async () => {
    const res = await call(`?redirect=${encodeURIComponent('/x</script><script>alert(1)</script>')}`)
    expect(await res.text()).not.toMatch(/<\/script><script>/)
  })

  it('is never cached and leaks no referrer', async () => {
    const res = await call('')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
  })
})
