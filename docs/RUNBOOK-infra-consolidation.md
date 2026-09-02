# Runbook — consolidate Vercel, split Supabase

A walk-through you can stop and resume. **Nothing here assumes you remember the
session it came from.** Do the phases in order; each says what to expect and how
to tell it worked.

Target state:

```
GitHub dev   ──► Vercel PREVIEW     ──► Supabase  hsnef-member-portal-dev  (new, to create)
GitHub main  ──► Vercel PRODUCTION  ──► Supabase  gapvsdrzavjaublwkqfm     (existing, becomes prod)
                 ONE Vercel project
```

**Progress — tick these as you go, so a later session knows where you stopped:**

- [~] Phase 1 — Vercel down to one project — **mostly done 2026-09-02, see 1.5/1.7 below**
- [ ] Phase 2 — fix `member.hsnef.org` (it is DOWN)
- [ ] Phase 3 — apply the events migration
- [ ] Phase 4 — clean the test data
- [ ] Phase 5 — create the dev Supabase project
- [ ] Phase 6 — merge the PR

---

## Before you start — three facts that are easy to get wrong

1. **`member.hsnef.org` is currently DOWN.** It resolves to Cloudflare, not
   Vercel, and returns a 308 redirect to itself forever. It is not serving the
   app and has not been for some time. Phase 2 deals with it — do not be alarmed
   when the Vercel work alone does not fix it.
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

### 1.5 — Point production at `main` — STILL TO DO

`vercel.com/hsnef/member` → **Settings → Environments → Production →
Branch Tracking** → change `dev` to `main` → **Save**.

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

### 1.7 — Add the two missing variables — STILL TO DO

**Settings → Environment Variables**, scope **All Environments**. Both values are
already in your local `.env.local`; copy them across.

| Name | Why it matters |
|---|---|
| `CRON_SECRET` | Without it the nightly login-log cleanup returns an error and silently never runs |
| `ZELLE_TOKEN_SECRET` | The code falls back to `QR_TOKEN_SECRET`; if that ever went missing it falls back to a **literal string committed in this now-public repo**, which would let anyone forge Zelle payment tokens |

Claude was blocked from copying these out of `.env.local` to an external service.
That is the correct behaviour — do it by hand.

---

## Phase 2 — Fix `member.hsnef.org`

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

### 5.1 — Create it

Supabase dashboard → **New project** → name `hsnef-member-portal-dev` → same
region as the existing one. Note its ref.

### 5.2 — Push the schema

```bash
npx supabase link --project-ref <the new ref>
npx supabase db push
```

**Expect:** 29 migrations apply cleanly.

*This now works.* Two pairs of migrations previously shared a version number,
which Supabase treats as a primary key, so the push would have failed outright.
They were renumbered on 2026-09-02 — `member_audit_log` to `20260108000010` and
`event_rsvp_payable_flags` to `20260111000005` — with the dependency order
preserved (`test_accounts` still runs before `update_constraints_for_test_accounts`,
and `member_audit_log` still runs before `fix_audit_trigger_permissions`).

### 5.3 — Point Preview at the new project

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
- **`npx tsc --noEmit` reports 187 errors**, mostly local `interface` shapes that
  have drifted from `types/database.ts`. Real, not urgent.
