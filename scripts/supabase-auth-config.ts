/**
 * Compare or apply supabase/auth-config.ts to one Supabase project.
 *
 *   npm run supabase:auth-config -- --env dev            # show differences (read-only)
 *   npm run supabase:auth-config -- --env dev --apply    # apply them
 *   npm run supabase:auth-config -- --env prod --apply --confirm-production
 *
 * Needs SUPABASE_ACCESS_TOKEN (a personal access token) in the environment;
 * `npm run` loads .env.local. To include custom SMTP, also set
 * RESEND_SMTP_KEY_DEV / RESEND_SMTP_KEY_PROD (a Resend API key); without it the
 * SMTP settings are left exactly as they are. GOOGLE_OAUTH_CLIENT_SECRET is
 * needed the first time Google is turned on for a project; once a project
 * holds a secret it can be omitted.
 *
 * Production is an approval gate: applying to prod requires
 * --confirm-production, and should only be run with explicit sign-off.
 */
import { GOOGLE_OAUTH_SECRET_ENV, PROJECTS, SMTP_PASSWORD_ENV, desiredAuthSettings, type AuthEnv } from '../supabase/auth-config'

const args = process.argv.slice(2)
const envArg = args[args.indexOf('--env') + 1]
const apply = args.includes('--apply')

if (envArg !== 'dev' && envArg !== 'prod') {
  console.error('Usage: npm run supabase:auth-config -- --env dev|prod [--apply] [--confirm-production]')
  process.exit(1)
}
const env = envArg as AuthEnv
if (env === 'prod' && apply && !args.includes('--confirm-production')) {
  console.error('Refusing to change PRODUCTION auth settings without --confirm-production.')
  process.exit(1)
}

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN is not set.')
  process.exit(1)
}

const smtpKey = process.env[SMTP_PASSWORD_ENV[env]]
const desired: Record<string, unknown> = desiredAuthSettings(env, { includeSmtp: Boolean(smtpKey) })
const endpoint = `https://api.supabase.com/v1/projects/${PROJECTS[env].ref}/config/auth`
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

const show = (v: unknown) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  return s.length > 70 ? `${s.slice(0, 67)}…` : s
}

async function main() {
  const res = await fetch(endpoint, { headers })
  if (!res.ok) throw new Error(`read ${env}: HTTP ${res.status} ${await res.text()}`)
  const current = (await res.json()) as Record<string, unknown>

  // Never switch Google on without a secret: the button would fail for everyone.
  const googleSecret = process.env[GOOGLE_OAUTH_SECRET_ENV]
  const googleReady = Boolean(googleSecret) || Boolean(current.external_google_secret)
  if (!googleReady) {
    delete desired.external_google_enabled
    delete desired.external_google_client_id
  }

  const changes = Object.keys(desired).filter((k) => String(current[k] ?? '') !== String(desired[k]))
  console.log(`${env} (${PROJECTS[env].ref}) — ${changes.length} setting(s) differ from supabase/auth-config.ts`)
  for (const k of changes) console.log(`  ${k}\n    live: ${show(current[k])}\n    want: ${show(desired[k])}`)
  if (!smtpKey) console.log(`  (SMTP not managed this run: ${SMTP_PASSWORD_ENV[env]} is not set)`)
  if (!googleReady) console.log(`  (Google not turned on this run: ${GOOGLE_OAUTH_SECRET_ENV} is not set and the project has no secret yet)`)

  if (!apply) {
    if (changes.length) console.log('\nRead-only. Re-run with --apply to change them.')
    return
  }
  if (!changes.length && !smtpKey && !googleSecret) return

  const body: Record<string, unknown> = Object.fromEntries(changes.map((k) => [k, desired[k]]))
  if (smtpKey) body.smtp_pass = smtpKey // write-only; never printed
  if (googleSecret) body.external_google_secret = googleSecret // write-only; never printed
  const patch = await fetch(endpoint, { method: 'PATCH', headers, body: JSON.stringify(body) })
  if (!patch.ok) throw new Error(`apply ${env}: HTTP ${patch.status} ${await patch.text()}`)
  console.log(`\nApplied ${Object.keys(body).length} setting(s) to ${env}.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
