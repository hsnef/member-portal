import { describe, expect, it } from 'vitest'
import { DEFAULT_AFTER_SIGN_IN, destinationFromNext, safeRedirectPath } from './redirect'

describe('safeRedirectPath', () => {
  it('keeps same-site paths, with their query', () => {
    expect(safeRedirectPath('/member')).toBe('/member')
    expect(safeRedirectPath('/admin/bookings/123?tab=items')).toBe('/admin/bookings/123?tab=items')
  })

  it('decodes the encoded form the login page sends', () => {
    expect(safeRedirectPath('%2Fadmin%2Fevents')).toBe('/admin/events')
  })

  it('falls back when missing', () => {
    expect(safeRedirectPath(null)).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(safeRedirectPath('')).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('refuses other sites — the open-redirect cases', () => {
    for (const bad of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      '%2F%2Fevil.example',
      'evil.example/member',
    ]) {
      expect(safeRedirectPath(bad), bad).toBe(DEFAULT_AFTER_SIGN_IN)
    }
  })

  it('refuses control characters', () => {
    expect(safeRedirectPath('/member\n/evil')).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('never sends someone back into the sign-in flow', () => {
    expect(safeRedirectPath('/login')).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(safeRedirectPath('/auth/callback?code=x')).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('honours a custom fallback', () => {
    expect(safeRedirectPath('//evil', '/admin')).toBe('/admin')
  })
})

describe('destinationFromNext — the sign-in email’s `next`', () => {
  const site = 'https://member.hsnef.org'

  it('unwraps our own callback URL to its redirect', () => {
    expect(destinationFromNext(`${site}/auth/callback?redirect=/admin/bookings`, site)).toBe('/admin/bookings')
  })

  it('works the same on dev — only the origin differs', () => {
    const dev = 'https://dev.member.hsnef.org'
    expect(destinationFromNext(`${dev}/auth/callback?redirect=/member/pass`, dev)).toBe('/member/pass')
  })

  it('accepts a plain same-site URL', () => {
    expect(destinationFromNext(`${site}/member/events`, site)).toBe('/member/events')
  })

  it('refuses another origin, including the other environment', () => {
    expect(destinationFromNext('https://evil.example/auth/callback?redirect=/member', site)).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(destinationFromNext('https://dev.member.hsnef.org/member', site)).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('refuses a malicious redirect nested inside our own callback', () => {
    expect(destinationFromNext(`${site}/auth/callback?redirect=//evil.example`, site)).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('falls back on the bare site URL Supabase uses when the redirect is not allow-listed', () => {
    expect(destinationFromNext(site, site)).toBe('/')
    expect(destinationFromNext(null, site)).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(destinationFromNext('not a url', site)).toBe(DEFAULT_AFTER_SIGN_IN)
  })
})
