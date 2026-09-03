# Railway migration — analysis and plan

_Written 2026-09-02. No work has been done on this; it is a decision document._

The incoming maintainer prefers Railway. Three questions get asked together and
have very different answers, so they are separated here.

---

## The short answer

| Option | Verdict | Effort | Risk |
|---|---|---|---|
| **Railway (app) + managed Supabase** | Straightforward | ~2–4 days, mostly verification | **Low** |
| **Railway only — Railway Postgres, no Supabase** | Possible, but a rewrite of auth and access control | Weeks to months | **High** |
| **Self-hosted Supabase on Railway** | Works; cost moves to operations | ~1 week | Medium, ongoing |

**Recommendation: move hosting to Railway, keep managed Supabase.** That delivers
"mostly Railway" without touching the two areas where mistakes are silent and
serious. Revisit dropping Supabase only if something concrete forces it — cost,
or a capability it lacks. *One fewer vendor* is a weak reason to rewrite an
authentication and authorisation layer that currently works.

---

## Why "Railway only" is expensive

Supabase is not a database here. It is four products, and the app leans on all
four.

**1. Auth.** Magic links, Google OAuth, PKCE, session refresh, JWT issuance.
Replacing it (Auth.js, Lucia) touches `lib/auth/AuthContext.tsx`,
`middleware.ts`, `/auth/callback`, `/api/auth/link-member`, and the login and
register pages — the entire sign-in surface.

**2. Row Level Security — the real danger.** All 30 tables enforce per-member
access *in the database*, through policies referencing `auth.uid()`. The
application code trusts that backstop and does not defensively filter
everywhere. On plain Postgres you must either rewrite every query to enforce
access in application code, or replicate RLS by setting a per-request session
variable and rewriting every policy. **Get it subtly wrong and members see each
other's records, with no error to indicate it.** This application holds home
addresses, children's names and payment history.

**3. The data layer.** Every call is `supabase.from('...').select(...)`.
Swapping to Prisma or Drizzle means touching essentially all 61 routes.

**4. Storage.** Event images use Supabase Storage with policies
(`20260111000002_event_images_storage_policies.sql`). Would need S3, R2 or a
Railway volume, plus reimplemented access rules.

Doing this immediately after a port that surfaced nine latent bugs would
compound risk considerably.

---

## Plan for the recommended option: Railway + Supabase

### Can Claude do most of it independently?

**Yes — roughly 70–80%.** Everything that is code, configuration or
verification. The remainder is account creation, secrets and DNS, which are
yours by nature rather than by limitation.

**Claude can do, unattended:**

- `Dockerfile` (or Nixpacks config) and `railway.json`
- Add `output: 'standalone'` to `next.config.ts` — `next.config.ts` currently
  sets no output mode, so the image would otherwise carry all of `node_modules`
- Replace the `vercel.json` cron with a Railway cron service. The current cron is
  `/api/cron/cleanup-login-logs` on `0 2 * * *`
- Pin a Node version — `package.json` has **no `engines` field**, so Railway
  would pick its own default and could differ from the 24.x that Vercel used
- Add a `/api/health` endpoint for Railway's healthcheck
- Confirm `scripts/generate-version.ts` survives Railway's checkout. It shells
  out to `git rev-list --count HEAD` and falls back to a `.commit-count` file
  — a fallback added *specifically* because Vercel uses shallow clones, so it
  will probably hold, but it needs verifying rather than assuming
- Map all 25 environment variable **names** across environments
- Local build verification, route-by-route smoke tests against the deployment
- Update `CLAUDE.md`, `PROJECT-HUB.md`, the SDLC docs and the runbooks

**Claude cannot do, and why:**

| Needed | Why it is yours |
|---|---|
| Railway account, project, billing | Account creation is out of scope for an agent |
| **Setting secret values** in Railway | Copying secrets out of `.env.local` into an external service is blocked by design — the guard fired on exactly this during the Vercel work. Names can be prepared; values must be pasted by a person |
| DNS cutover in Cloudflare | No Cloudflare access, and it is the irreversible-feeling step |
| Deleting the Vercel project | Should follow a period of both running in parallel |

### What Claude would need from you

1. **A Railway project**, created and linked to `hsnef/member-portal`.
2. **A Railway API token** — optional but it changes the shape of the work. With
   one, services, variables (non-secret), domains and deploys can be driven
   directly, the way the Vercel API was used on 2026-09-02. Without it, Claude
   prepares everything and you click through Railway's dashboard.
3. **The 25 secret values**, entered by you into Railway.
4. **A decision on preview environments** — see the open question below.
5. **DNS**, when you are ready to cut over.

### Sequence

1. Claude prepares the Dockerfile, `railway.json`, health endpoint, Node pin and
   standalone output. Verified by a local build.
2. You create the Railway project and paste the secrets.
3. Deploy to a Railway-generated URL. **Nothing points at it yet.**
4. Smoke test on that URL: sign-in, member dashboard, admin list, a payment
   page, the cron endpoint.
5. Run **both platforms in parallel** for a few days, pointed at the same
   Supabase project. This is what makes the migration low-risk — there is no
   moment where the only copy is the new one.
6. Cut DNS over. Keep Vercel deployable but idle.
7. Delete the Vercel project only after a week of quiet.

### Open question to settle first

Vercel gives per-branch previews, which is what the current dev/prod split rests
on: `main` → production → `prod-mp`, `dev` → preview → `dev-mp`. Railway models
this as **environments** rather than branch previews.

The mapping needs deciding before any work starts:

- a Railway **production** environment tracking `main`, pointed at `prod-mp`, and
- a Railway **dev** environment tracking `dev`, pointed at `bcujsesgrzijyisvmnwm`

That reproduces today's behaviour, but it is a different mental model and the
two custom domains (`member.hsnef.org`, `dev.member.hsnef.org`) must be attached
to the right one. Getting this wrong is how a dev deployment ends up serving
production data — precisely the failure that Phase 5 of the infra runbook just
eliminated.

### Known snags, worth expecting

- **Image optimisation** runs on your own CPU under `next start`. `sharp` is
  already a dependency, so it works, but a Railway container is not Vercel's
  image CDN. Watch memory.
- **Middleware** runs in Node when self-hosting rather than on the Edge. This is
  an improvement here — the Vercel builds emit Edge Runtime warnings about
  `@supabase/realtime-js` using `process.versions`, and those disappear.
- **No `engines` field** in `package.json` means Railway's default Node version
  applies. Pin it before the first deploy, not after a mystery failure.
- **The cron endpoint requires `CRON_SECRET`.** It was missing from Vercel until
  2026-09-02, and the job silently returned an error rather than failing loudly.
  The same trap exists on Railway.

---

## If the goal really is "no Supabase"

The honest middle path is **self-hosted Supabase on Railway**. It is open source
and Railway templates exist. The application needs almost no changes: same
client library, same RLS, same auth.

The cost moves from engineering to operations. You would run Postgres, GoTrue,
PostgREST, Realtime, Storage and Kong as containers, and own backups, upgrades,
and uptime for an application holding member PII and payment records. For a
volunteer-maintained temple portal that is a real, recurring burden — but it is
reversible, which a rewrite is not.
