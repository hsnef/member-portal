/**
 * Supabase Auth settings for BOTH projects, as code.
 *
 * Applied with `npm run supabase:auth-config -- --env dev|prod [--apply]`
 * (scripts/supabase-auth-config.ts). Without `--apply` it only shows the
 * difference between this file and the live project.
 *
 * Why this exists: the settings were set by hand in each dashboard and
 * drifted — dev kept `http://localhost:3000` as its site URL with no redirect
 * allow-list, and production allowed redirects to localhost and the dev site.
 * Sign-in must behave identically on dev and production; the ONLY differences
 * are the site address and which addresses may receive a redirect, and a test
 * (`auth-config.test.ts`) fails if anything else diverges.
 *
 * Which project is which: docs/SUPABASE-PROJECTS.md.
 */
import { EMAIL, EMAIL_FONT } from '../lib/email/theme'
import { TEMPLE_CONFIG } from '../lib/constants/temple'

export type AuthEnv = 'dev' | 'prod'

export const PROJECTS: Record<AuthEnv, { ref: string; site: string; allowList: string[] }> = {
  dev: {
    ref: 'bcujsesgrzijyisvmnwm',
    site: 'https://dev.member.hsnef.org',
    // Local development signs in against dev, so localhost is allowed here only.
    allowList: ['https://dev.member.hsnef.org/**', 'http://localhost:3000/**'],
  },
  prod: {
    ref: 'gapvsdrzavjaublwkqfm',
    site: 'https://member.hsnef.org',
    allowList: ['https://member.hsnef.org/**'],
  },
}

/**
 * The link in every sign-in email.
 *
 * `token_hash` is verified by the server in /auth/callback, so the link works
 * on any device. Supabase's default `{{ .ConfirmationURL }}` uses a PKCE code
 * whose verifier lives only in the browser that asked — open the email on
 * your phone and it fails. `next` carries where the member was going.
 */
export const SIGN_IN_LINK =
  '{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}'

function signInEmail(heading: string, intro: string): string {
  const t = TEMPLE_CONFIG
  return `<div style="margin:0;padding:24px 0;background:${EMAIL.canvas};font-family:${EMAIL_FONT};">
  <div style="max-width:520px;margin:0 auto;background:${EMAIL.surface};border:1px solid ${EMAIL.line};border-radius:12px;overflow:hidden;">
    <div style="background:${EMAIL.kumkum};padding:20px 28px;color:${EMAIL.inkInverse};font-size:15px;letter-spacing:.02em;">${t.name}</div>
    <div style="padding:28px;color:${EMAIL.ink};font-size:16px;line-height:1.55;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:${EMAIL.ink};">${heading}</h1>
      <p style="margin:0 0 24px;color:${EMAIL.ink2};">${intro}</p>
      <p style="margin:0 0 24px;"><a href="${SIGN_IN_LINK}" style="display:inline-block;background:${EMAIL.saffron};color:${EMAIL.surface};text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Sign in to the member portal</a></p>
      <p style="margin:0 0 8px;color:${EMAIL.ink3};font-size:14px;">This link works once and expires in one hour. You can open it on any device.</p>
      <p style="margin:0;color:${EMAIL.ink3};font-size:14px;">If you did not ask to sign in, you can ignore this email.</p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid ${EMAIL.line};color:${EMAIL.ink3};font-size:13px;">${t.shortName} office · ${t.contact.phone} · ${t.contact.email}</div>
  </div>
</div>`
}

/**
 * Settings identical in both projects. Keys are Management API field names
 * (GET/PATCH /v1/projects/{ref}/config/auth).
 *
 * Supabase sends "Confirm signup" the first time an address signs in and
 * "Magic link" every time after, so both carry the same link.
 */
export const SHARED_AUTH_SETTINGS = {
  external_email_enabled: true,
  mailer_otp_exp: 3600,
  mailer_subjects_magic_link: `Your ${TEMPLE_CONFIG.shortName} sign-in link`,
  mailer_templates_magic_link_content: signInEmail('Sign in', 'Use the button below to sign in to the member portal.'),
  mailer_subjects_confirmation: `Your ${TEMPLE_CONFIG.shortName} sign-in link`,
  mailer_templates_confirmation_content: signInEmail('Welcome', 'Use the button below to sign in to the member portal for the first time.'),
} as const

/**
 * Custom SMTP through Resend, on the verified `portal.hsnef.org` domain (NOT
 * member.hsnef.org, which Resend has not verified). The password is a Resend
 * API key, supplied at apply time via an environment variable and never
 * stored here. The built-in mailer allows 2 emails/hour and is not for real
 * users, so the rate limit is only raised together with SMTP.
 */
export const SMTP_SETTINGS = {
  smtp_host: 'smtp.resend.com',
  smtp_port: '465',
  smtp_user: 'resend',
  smtp_admin_email: 'noreply@portal.hsnef.org',
  smtp_sender_name: TEMPLE_CONFIG.shortName,
  rate_limit_email_sent: 60,
} as const

export const SMTP_PASSWORD_ENV: Record<AuthEnv, string> = {
  dev: 'RESEND_SMTP_KEY_DEV',
  prod: 'RESEND_SMTP_KEY_PROD',
}

/** The full desired settings for one project, excluding the SMTP password. */
export function desiredAuthSettings(env: AuthEnv, { includeSmtp }: { includeSmtp: boolean }) {
  const p = PROJECTS[env]
  return {
    site_url: p.site,
    uri_allow_list: p.allowList.join(','),
    ...SHARED_AUTH_SETTINGS,
    ...(includeSmtp ? SMTP_SETTINGS : {}),
  }
}
