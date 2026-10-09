import { describe, expect, it } from 'vitest'
import { PROJECTS, SHARED_AUTH_SETTINGS, SIGN_IN_LINK, desiredAuthSettings } from './auth-config'

describe('auth settings as code', () => {
  it('dev and prod differ ONLY in site address and redirect allow-list', () => {
    const dev = desiredAuthSettings('dev', { includeSmtp: true })
    const prod = desiredAuthSettings('prod', { includeSmtp: true })
    const differing = Object.keys(dev).filter((k) => dev[k as keyof typeof dev] !== prod[k as keyof typeof prod])
    expect(differing.sort()).toEqual(['site_url', 'uri_allow_list'])
  })

  it('production accepts redirects only to production', () => {
    for (const entry of PROJECTS.prod.allowList) {
      expect(entry.startsWith('https://member.hsnef.org/')).toBe(true)
    }
    expect(desiredAuthSettings('prod', { includeSmtp: false }).uri_allow_list).not.toMatch(/localhost|dev\./)
  })

  it('every allow-list covers its own site, so the email can carry the destination', () => {
    for (const env of ['dev', 'prod'] as const) {
      expect(PROJECTS[env].allowList).toContain(`${PROJECTS[env].site}/**`)
    }
  })

  it('project refs match docs/SUPABASE-PROJECTS.md', () => {
    expect(PROJECTS.dev.ref).toBe('bcujsesgrzijyisvmnwm')
    expect(PROJECTS.prod.ref).toBe('gapvsdrzavjaublwkqfm')
  })

  it('sign-in emails use the any-device token link, never the browser-bound default', () => {
    expect(SIGN_IN_LINK).toContain('/auth/callback?token_hash={{ .TokenHash }}&type=email')
    for (const key of ['mailer_templates_magic_link_content', 'mailer_templates_confirmation_content'] as const) {
      expect(SHARED_AUTH_SETTINGS[key]).toContain(SIGN_IN_LINK)
      expect(SHARED_AUTH_SETTINGS[key]).not.toContain('ConfirmationURL')
    }
  })

  it('the SMTP password is never part of the stored settings', () => {
    expect(JSON.stringify(desiredAuthSettings('prod', { includeSmtp: true }))).not.toMatch(/smtp_pass/)
  })
})
