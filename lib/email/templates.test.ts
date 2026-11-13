import { afterEach, describe, expect, it, vi } from 'vitest'
import { welcomeEmail } from './templates'

const member = { first_name: 'A', last_name: 'Member', membership_id: '20000100', primary_email: 'a@example.org' } as any

describe('email footer', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('links the portal, not the sending domain', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    const { html } = welcomeEmail(member)
    expect(html).toContain('href="https://member.hsnef.org"')
    expect(html).not.toContain('portal.hsnef.org')
  })

  it('follows NEXT_PUBLIC_APP_URL, so dev emails link dev', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://dev.member.hsnef.org')
    expect(welcomeEmail(member).html).toContain('href="https://dev.member.hsnef.org"')
  })
})

describe('invitation', () => {
  it('tells someone who asked for a paid level how to complete it, and no one else', async () => {
    const { registrationInvitationEmail } = await import('./templates')
    const asked = registrationInvitationEmail({ ...member, requested_level: 'Lifetime' }, 'https://member.hsnef.org/login')
    expect(asked.text).toContain('Complete my Lifetime membership')
    expect(asked.html).toContain('Complete my Lifetime membership')
    const community = registrationInvitationEmail({ ...member, requested_level: null }, 'https://member.hsnef.org/login')
    expect(community.text).not.toContain('Complete my')
  })
})
