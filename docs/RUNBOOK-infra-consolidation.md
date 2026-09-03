# Runbook — consolidate Vercel, split Supabase

A walk-through you can stop and resume. **Nothing here assumes you remember the
session it came from.** Do the phases in order; each says what to expect and how
to tell it worked.

Target state — **reached 2026-09-02 except Phase 4, which is optional:**

```
GitHub dev   ──► Vercel PREVIEW     ──► Supabase  dev-mp   bcujsesgrzijyisvmnwm   (created 2026-09-02)
GitHub main  ──► Vercel PRODUCTION  ──► Supabase  prod-mp  gapvsdrzavjaublwkqfm   (existing, is prod)
                 ONE Vercel project, `member`
```

**Progress — tick these as you go, so a later session knows where you stopped:**

- [x] Phase 1 — Vercel down to one project — **DONE 2026-09-02**
- [x] Phase 2 — fix `member.hsnef.org` — **DONE 2026-09-02, verified 2026-09-03**
- [x] Phase 3 — apply the events migration — **DONE 2026-09-02**
- [ ] Phase 4 — clean the test data
- [x] Phase 5 — create the dev Supabase project — **DONE 2026-09-02, environments verified separate**
- [x] Phase 6 — merge the PR — **DONE 2026-09-02**

---

## Before you start — three facts that are easy to get wrong

1. **`member.hsnef.org` is UP** as of 2026-09-02, verified 2026-09-03. It used to
   resolve to Cloudflare rather than Vercel and return a 308 redirect to itself
   forever; the proxy was switched off and it now serves the app. Phase 2 records
   what was done. Nothing here still depends on it.
2. **The Supabase ref `gapvsdrzavjaublwkqfm` is permanent.** You can rename the
   project in the dashboard, but production's URL will always be
   `gapvsdrzavjaublwkqfm.supabase.co`. That is fine; just do not go hunting for
   a "prod" ref later.
3. **There is now ONE Vercel project, `member`** (done 2026-09-02). The old
   empty project is retired as `member-legacy` with its git connection removed,
   so it cannot build. Its **production branch is still `dev`** — flipping it to
   `main` is step 1.5 and has to be done in the dashboard.

---

## Phase 1 — Vercel down to one project

**Status: done on 2026-09-02 except two dashboard-only steps (1.5 and 1.7).**

### What was found

The `member` project had **zero environment variables**. Not wrongly scoped —
none at all. That is why every one of its builds failed, and it means nothing was
lost by retiring it. `dev.member` holds all 23, each scoped to development,
preview and production.

### What was done, via the Vercel API

| Step | |
|---|---|
| 1.1 | Compared both projects' variables. `member`: 0. `dev.member`: 23. Nothing unique on `member` |
| 1.2 | Released `member.hsnef.org` from the old project |
| 1.3 | **Not deleted.** Its git connection was removed and it was renamed `member-legacy`, so it can no longer build or post a check. Still recoverable — delete it whenever you like |
| 1.4 | `dev.member` renamed to `member` |
| 1.6 | `member.hsnef.org` attached to the kept project |
| 1.8 | Verified: PR #4 shows **one** Vercel check, and it passes |

### 1.5 — Point production at `main` — DONE 2026-09-02

Done by Sujit in the dashboard: **Settings → Environments → Production →
Branch Tracking** → `main` → Save. Verified via the API: `productionBranch = main`.

`dev.member.hsnef.org` was then repointed to the **`dev` branch** via the API and
confirmed still serving HTTP 200. `member.hsnef.org` follows production (`main`);
`devportal-iota.vercel.app` likewise.

> **A UI trap worth knowing.** On the domain editor, connecting a domain to
> *Preview* leaves **Save greyed out** until you pick an actual branch — the
> "All Branches" text is placeholder in an empty search field, not a selection.
> Nothing saves and there is no error to tell you why.

Original instructions, for reference:

> Older Vercel docs (and an earlier version of this runbook) say *Settings →
> Git → Production Branch*. In the current UI it lives under **Environments**,
> on the Production environment page. Verified from the dashboard 2026-09-02.

The API ignores this field — three different payload shapes were tried and all
returned success while leaving it unchanged. It has to be the dashboard.

> **Until this is done, merging PR #4 will not deploy to production**, and
> `member.hsnef.org` serves whatever is on `dev`.

**Then, in this order, repoint the dev URL.** All three domains currently follow
the production branch — verified via the API — so the moment production becomes
`main`, `dev.member.hsnef.org` starts serving `main` too and the dev environment
is lost. Fix it via **Project domain settings** → `dev.member.hsnef.org` → assign
to git branch **`dev`**.

*Order matters:* pinning that domain to `dev` while `dev` is still the production
branch is ambiguous — Vercel treats it as a branch deployment that may not exist
yet, and the URL can 404 until the next push. Flip production first, pin second.

### 1.7 — Add the two missing variables — DONE 2026-09-02

Added by Sujit. Verified via the API: **25 distinct variables, every one scoped to
production, preview and development** — `CRON_SECRET` and `ZELLE_TOKEN_SECRET`
included. Nothing is missing.

Original instructions, for reference — **Settings → Environment Variables**, scope
**All Environments**, values from `.env.local`:

| Name | Why it matters |
|---|---|
| `CRON_SECRET` | Without it the nightly login-log cleanup returns an error and silently never runs |
| `ZELLE_TOKEN_SECRET` | The code falls back to `QR_TOKEN_SECRET`; if that ever went missing it falls back to a **literal string committed in this now-public repo**, which would let anyone forge Zelle payment tokens |

Claude was blocked from copying these out of `.env.local` to an external service.
That is the correct behaviour — do it by hand.

---

## Phase 6 — Merge the PR — DONE 2026-09-02

PR #4 merged as a **merge commit** (2 parents, not a squash — `main` is now 110
commits). The production deployment built and went **READY** from `main`, and
`devportal-iota.vercel.app` serves the redesign: HTTP 200 with `--saffron`,
`--kumkum` and `--marigold` in the CSS and zero legacy hex values.

At the time of the merge `member.hsnef.org` still returned **308** — Cloudflare,
Phase 2 — so production was built and healthy but not yet reachable. **That was
fixed later the same day; the domain now serves 200 from Vercel.** See Phase 2.

### Both URLs are public, deliberately — and what that costs

Repointing `dev.member.hsnef.org` to the `dev` branch briefly put it behind
Vercel's login, because it began serving a *preview* rather than a production
deployment and `ssoProtection` only exempts **production** custom domains.

**That was reverted on purpose.** `ssoProtection` is now `null`. The requirement
is that anyone can reach both `member.hsnef.org` and `dev.member.hsnef.org` —
testers are invited to try the site and will not have Vercel accounts, so a login
wall makes the dev URL useless for its actual job. Both return HTTP 200 with no
authentication.

> **This raises the stakes on Phase 5.** Every environment still shares ONE
> Supabase database (DEC-006). So a publicly reachable dev portal now sits in
> front of **live member data**, and anyone testing on `dev.member.hsnef.org` is
> reading and writing real member records — bookings, profiles, payments.
>
> The fix is not a login wall; it is Phase 5. Once `dev` points at its own
> Supabase project, the dev URL can stay wide open and cost nothing, because
> there will be nothing real behind it. **Until then, treat every action taken on
> the dev URL as an action against production.**

---

## Phase 2 — Fix `member.hsnef.org` — DONE 2026-09-02

**The fix that worked:** the `member` record was proxied (orange cloud) and
resolved to Cloudflare IPs, which looped with Vercel. Whoever held Cloudflare
access set it to a CNAME → `b71df0496b881ead.vercel-dns-017.com` with **Proxy
status: DNS only** — identical to the sibling `dev.member` record that had always
worked. No SSL/TLS mode change and no redirect-rule edit were needed.

**Verified 2026-09-03:**

```
$ curl -sI https://member.hsnef.org | head -3
HTTP/1.1 200 OK
Server: Vercel

$ nslookup member.hsnef.org
Name:    b71df0496b881ead.vercel-dns-017.com
Addresses:  64.29.17.1, 216.198.79.1        # Vercel anycast, not Cloudflare
Aliases:  member.hsnef.org
```

The shipped stylesheet on that host carries the design-system tokens
(`--saffron --kumkum --tulsi --marigold --canvas --ink`), so production is serving
the redesign and not a stale build.

### 2.0 (original instructions, for reference)

> **Shareable version:** [`docs/RUNBOOK-cloudflare-member-domain.md`](RUNBOOK-cloudflare-member-domain.md)
> is a self-contained walkthrough for whoever holds Cloudflare access. It assumes
> no knowledge of this project — send them that file rather than this one.
>
> **The diagnosis, short version:** the `member` record is proxied (orange cloud)
> and resolves to Cloudflare IPs `172.67.142.57` / `104.21.39.23`. The sibling
> `dev.member` record is a CNAME to `b71df0496b881ead.vercel-dns-017.com` with the
> proxy **off**, and it works. Turning the proxy off for `member` is the fix.


**Why:** it is on Cloudflare, looping, and never reaches Vercel. Phase 1 does not
touch DNS, so this is separate work.

### 2.1 — Confirm the symptom

```bash
curl -sI https://member.hsnef.org | head -3
```

**Expect today:** `HTTP/2 308` with `location: https://member.hsnef.org/` — a
redirect to itself — and `server: cloudflare`.

### 2.2 — Find the loop in Cloudflare

In the Cloudflare dashboard for `hsnef.org`:

- **SSL/TLS → Overview** — if the mode is **Flexible**, that alone causes this
  loop with Vercel. Set it to **Full (strict)**.
- **Rules → Redirect Rules / Page Rules** — look for any rule matching
  `member.hsnef.org` that redirects to itself. Delete or correct it.
- **DNS** — the `member` record should be a CNAME to `cname.vercel-dns.com`. Set
  it to **DNS only** (grey cloud) to start with: Vercel terminates TLS itself,
  and the orange cloud is what makes Flexible mode misbehave.

### 2.3 — Verify

```bash
curl -sI https://member.hsnef.org | head -3
```

**Expect:** `HTTP/2 200`, and `server: Vercel` rather than `cloudflare`.

---

## Phase 3 — Apply the events migration

**Why:** every events page queries columns the database does not have, so each
query returns HTTP 400 and the page falls through to "no events yet" — a broken
feature that merely looks empty. See DEC-009.

**Do this before Phase 5**, so the new dev project is built from a schema that
already includes it.

### 3.1 — Run it

Supabase dashboard → project `gapvsdrzavjaublwkqfm` → **SQL Editor** → **New
query** → paste the entire contents of
`supabase/migrations/20260901000001_events_align_with_application.sql` → **Run**.

*Safe:* both `events` and `event_registrations` are empty, so there is no data to
lose.

### 3.2 — Verify

```sql
select column_name from information_schema.columns
where table_name = 'events'
  and column_name in ('event_name','status','category','member_price','is_test_event');
```

**Expect:** five rows. Then open `/admin/events` — it should load with no 400 in
the console.

---

## Phase 4 — Clean the test data

**Why:** the existing project is becoming **production**, and it currently holds
seeded test accounts (`99990000`–`99995000`) that would become production
records.

### 4.1 — See what is there

```bash
node scripts/list-access.mjs
```

The four role-holding accounts — `dev-mp@`, `dev-mp+testadmin@`,
`dev-mp+testmanager@`, `dev-mp+teststaff@` — exist so the role gates can be
exercised. **Keep them until Phase 5 is done**, then recreate them on the new dev
project and remove them from production.

### 4.2 — Remove the rest

Sign in as an Admin → `/admin/test-accounts` → remove the seeded members you do
not need.

> **Known trap:** deleting an auth user who has accepted the terms fails with
> `23503`, because `terms_acceptances_auth_user_id_fkey` has no
> `ON DELETE CASCADE`. Delete the `terms_acceptances` row first.

---

## Phase 5 — Create the dev Supabase project

**Why:** today every environment shares one database, so a mistake made while
testing lands on live member data.

### 5.1 — Create it — DONE 2026-09-02

The existing project was renamed **`prod-mp`** (ref `gapvsdrzavjaublwkqfm`, which
never changes) and a new **`dev-mp`** created: ref **`bcujsesgrzijyisvmnwm`**,
`us-west-2`, Free/Nano.

Note the org is on the **Free plan**: two active projects is the cap, so this uses
the allowance exactly, and **free projects pause after about 7 days idle** — a dead
dev environment usually just needs an unpause from the dashboard.

### 5.2 — Push the schema — DONE 2026-09-02

All 28 migrations applied to `bcujsesgrzijyisvmnwm` via the Supabase Management
API (`POST /v1/projects/{ref}/database/query`). Verified against production:

```
prod tables: 30   dev tables: 30
in prod only: none
in dev only : none
RLS enabled on all 30 dev tables
6 test member records seeded
```

The dev database has the events columns (`event_name`, `status`, `category`,
`member_price`, `non_member_price`, `is_test_event`); **production still has
none of them** — that is DEC-009, still outstanding, and it is Phase 3.

Two things that had to be fixed to get here, both recorded in git:

1. **A latent ordering bug.** `test_accounts` inserted membership IDs in the
   `9xxxxxxx` range one migration *before* `update_constraints_for_test_accounts`
   relaxed `chk_membership_id_format` from `^[1-3][0-9]{5}00$`. It failed with
   `23514`. The two were swapped. **These migrations had never built a database
   from scratch** — the bug only surfaced when a second environment was created.
2. The Management API returns Cloudflare `error code: 1010` for requests with no
   `User-Agent` header. Not a Postgres error; send one.

### 5.2 (original instructions, for reference)

Two ways, both fine:

**Without any CLI login** — concatenate the migrations and paste them into the
dev project's SQL Editor:

```bash
python - <<'EOF'
import io,glob,os
files=sorted(glob.glob('supabase/migrations/*.sql'))
io.open('schema.sql','w',encoding='utf-8',newline='
').write(
  ''.join(f"
-- {os.path.basename(f)}
"+io.open(f,encoding='utf-8').read() for f in files))
print(len(files),'migrations ->  schema.sql')
EOF
```

Verified safe to concatenate: no explicit `BEGIN`/`COMMIT`, no
`CREATE INDEX CONCURRENTLY`, no psql meta-commands.

**Or via the CLI**, which needs a Supabase login *and* the database password:

```bash
npx supabase login
npx supabase link --project-ref <the new ref>
npx supabase db push
```

**Expect:** 28 migrations apply cleanly.

*This now works.* Two pairs of migrations previously shared a version number,
which Supabase treats as a primary key, so the push would have failed outright.
They were renumbered on 2026-09-02 — `member_audit_log` to `20260108000010` and
`event_rsvp_payable_flags` to `20260111000005` — with the dependency order
preserved (`test_accounts` still runs before `update_constraints_for_test_accounts`,
and `member_audit_log` still runs before `fix_audit_trigger_permissions`).

### 5.3 — Point Preview at the new project — DONE 2026-09-02

Verified from the shipped JavaScript, not from the settings page:

```
dev.member.hsnef.org  ->  bcujsesgrzijyisvmnwm.supabase.co   (dev-mp)
production            ->  gapvsdrzavjaublwkqfm.supabase.co   (prod-mp)
```

**The public dev URL no longer touches live member data.**

> **A trap that cost a build.** The first attempt failed with
> `@supabase/ssr: Your project's URL and API key are required`. The cause was a
> single mis-ticked box: `NEXT_PUBLIC_SUPABASE_ANON_KEY` had been saved with
> target **`development` only**, not `preview`. The URL and service-role key were
> right, so Preview had two of three values and the build died at prerender.
>
> If a preview build ever fails that way again, list the targets rather than
> reading the dashboard — a missing tick is invisible at a glance:
>
> ```bash
> curl -s "https://api.vercel.com/v10/projects/<projectId>/env?teamId=<teamId>" >   -H "Authorization: Bearer $VERCEL_TOKEN" > | python -c "import json,sys;[print(e['key'],sorted(e.get('target') or [])) for e in json.load(sys.stdin)['envs']]"
> ```
>
> Note also that `dev` and `redesign/design-system` both build, so a failure on
> one is not a failure on the other — check the ref before reading a log.

### 5.3 (original instructions, for reference)

Vercel → project `member` → **Settings → Environment Variables**. For
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`, add a **Preview-scoped** value pointing at the new
dev project, leaving the Production value on the existing one.

> This is the one place where "All Environments" is the wrong answer. Preview
> must reach the dev database; Production must reach the production database.

### 5.4 — Rename the old project

Supabase → `gapvsdrzavjaublwkqfm` → **Settings → General** → rename to
`hsnef-member-portal-prod`. Cosmetic; the ref does not change.

### 5.5 — Verify

Push to `dev`, open the preview URL, sign in, and confirm you are looking at the
**new** database — it will have no members until you add some.

---

## Phase 6 — Merge the PR

Only once Phase 1 leaves a single green Vercel check.

1. Open [PR #3](https://github.com/hsnef/member-portal/pull/3)
2. Confirm there is one Vercel check and it passed
3. **Merge pull request** — you do this; Claude never merges
4. Watch the Production deployment
5. Confirm `member.hsnef.org` returns 200 and shows the redesign

---

## Still open after all of this

- **Member PII remains in public git history** (DEC-010). Removing it needs a
  history rewrite. The repo is staying public for now, so rotate any key that was
  ever committed.
- **White on the saffron measures 4.26:1**, below WCAG AA's 4.5 for normal text.
  One line in `app/globals.css` — a brand decision, not a technical one.
- **`hsnef.org` publishes three `v=spf1` records.** RFC 7208 allows one, so
  receivers see a permerror.
- **Type errors remain**, mostly local `interface` shapes that have drifted from
  `types/database.ts`. Real, not urgent. Do not quote a count from this file —
  run `npx tsc --noEmit` and read the tail.
