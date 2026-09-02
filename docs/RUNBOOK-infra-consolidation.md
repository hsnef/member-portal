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
3. **Two Vercel projects exist today.** `member` holds `member.hsnef.org`, builds
   `dev` as a *Preview*, and is **failing**. `dev.member` holds
   `dev.member.hsnef.org`, builds `dev` as *Production*, and **works**. You are
   keeping `dev.member` and discarding `member`.

---

## Phase 1 — Vercel down to one project

> **Status 2026-09-02: done except two steps that need the dashboard.**
>
> Done via the Vercel API: env vars compared (**`member` had ZERO variables** —
> that, not scoping, is why every one of its builds failed, and it means nothing
> was lost); `member.hsnef.org` released; the old project **renamed to
> `member-legacy` and its git connection removed** rather than deleted, so it
> can no longer build or post checks but is still there if you want it — delete
> it whenever; `dev.member` renamed to **`member`**; `member.hsnef.org`
> re-attached. **PR #4 now shows a single green Vercel check.**
>
> **STILL TO DO — 1.5 and 1.7, both dashboard-only:**
>
> 1. **Production branch is still `dev`.** The API silently ignores this field on
>    three different payloads; it has to be the dashboard. `vercel.com/hsnef/member`
>    → **Settings → Git → Production Branch** → `main`. **Until you do this,
>    merging PR #4 will NOT deploy to production**, and `member.hsnef.org` serves
>    the `dev` branch.
> 2. **Immediately after that**, pin `dev.member.hsnef.org` to the `dev` branch
>    under **Settings → Domains** — otherwise it starts serving `main`.
> 3. **Add `CRON_SECRET` and `ZELLE_TOKEN_SECRET`** (values are in your
>    `.env.local`). Claude was blocked from copying secrets out of `.env.local`
>    to an external service, which is the right call — do it by hand.



**Why:** two projects building the same branch is the cause of the failing check
on the PR. The `member` project builds `dev` as a Preview and almost certainly
has no Preview-scoped environment variables. `dev.member` has every variable set
to **All Environments** (confirmed 2026-09-02 from the dashboard), which is why
it is the one worth keeping.

### 1.1 — Record what the doomed project holds

Open `vercel.com/hsnef/member` → **Settings → Environment Variables**.

Compare with `dev.member`'s list. **If `member` has any variable `dev.member`
does not, copy it across now.** Expected answer: none — but check, because this
is the last moment you can.

Then **Settings → Domains**, and note every domain attached. Expected:
`member.hsnef.org`.

### 1.2 — Release the domain

`vercel.com/hsnef/member` → **Settings → Domains** → remove `member.hsnef.org`.

*Why first:* a domain can live on only one Vercel project. It cannot be added to
the project you are keeping while this one still holds it.

*Impact:* none in practice — that hostname is not serving the app today anyway.

### 1.3 — Delete the `member` project

`vercel.com/hsnef/member` → **Settings → General** → scroll to the bottom →
**Delete Project**.

*Why:* Vercel project names must be unique in a team, so this name must be free
before the rename in 1.4.

### 1.4 — Rename `dev.member` to `member`

`vercel.com/hsnef/dev.member` → **Settings → General** → **Project Name** →
`member` → Save.

### 1.5 — Point production at `main`

Same project → **Settings → Git** → **Production Branch** → change `dev` to
`main` → Save.

> **This is the step that changes behaviour.** From here `main` deploys to
> Production and `dev` deploys as a Preview. The variables are already scoped to
> All Environments, so previews keep working — which is exactly why this step
> comes after 1.4 and not before.

### 1.6 — Reattach the domains

Same project → **Settings → Domains**:

- Add `member.hsnef.org`, left on the production branch.
- `dev.member.hsnef.org` should already be listed. Open it and **assign it to the
  `dev` branch**, not to production. Without this it will start serving whatever
  is on `main`.

### 1.7 — Add the two missing variables

**Settings → Environment Variables**, scope **All Environments**:

| Name | Value | Why it matters |
|---|---|---|
| `CRON_SECRET` | a long random string | Without it the nightly login-log cleanup returns an error and silently never runs |
| `ZELLE_TOKEN_SECRET` | a long random string | The code currently falls back to `QR_TOKEN_SECRET`; if that ever goes missing it falls back to a **literal string committed in this now-public repo**, which would let anyone forge Zelle payment tokens |

Generate a value:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.8 — Verify

Push anything to `dev`, or hit **Redeploy** on the latest deployment.

**Expect:** exactly ONE Vercel check on the PR, and it passes. If two still
appear, the old project was not deleted.

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
