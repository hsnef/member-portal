# HSNEF Member Portal — Project Hub

> The single source of truth for architecture decisions, current state, and session-to-session context. `/sdlc status` reads this file. Keep it current — a stale hub poisons the next session's context.

_Last checked 2026-09-03._

## Current Status

**The portal is live at https://member.hsnef.org, on the new design system, with dev
and production on separate databases. The DNS blocker cleared on 2026-09-02. There is
no infrastructure blocker left — the open items are quality and hygiene, not launch.**

- **Production** — `main` → Vercel production → Supabase `prod-mp`
  (`gapvsdrzavjaublwkqfm`). PR #4 merged 2026-09-02 (110 commits on `main`, a real
  merge commit). The build is READY and serves the design system; verified from the
  shipped CSS.
- **Dev** — `dev` → Vercel preview → Supabase `dev-mp` (`bcujsesgrzijyisvmnwm`).
  Verified from the shipped JS that each host resolves its own database. The public
  dev URL no longer touches live member data.
- **`member.hsnef.org` is UP.** Fixed 2026-09-02 by the person with Cloudflare access,
  verified here 2026-09-03: the record is a CNAME to
  `b71df0496b881ead.vercel-dns-017.com` with **Proxy status: DNS only**, resolving to
  Vercel anycast (`64.29.17.1` / `216.198.79.1`), returning `200` with `Server: Vercel`,
  and its stylesheet carries the design-system tokens. Re-check any time with
  `curl -sI https://member.hsnef.org | head -3`.
- **Health:** build clean (86/86 pages) · tests **48, all passing** (vitest, added
  2026-09-03) · lint
  failing (pre-existing) · types: run `npx tsc --noEmit`, do not trust a number
  written here.
- **Vercel** is now ONE project, `member`. The old empty project is retired as
  `member-legacy` with its git link removed; delete it whenever.

### Start here next session

1. **The infrastructure work is done.**
   [`docs/RUNBOOK-infra-consolidation.md`](RUNBOOK-infra-consolidation.md) phases 1, 2,
   3, 5 and 6 are all ticked; only Phase 4 (test-data cleanup) remains and it is
   optional. Do not restart that runbook — read its ticks first.
2. **Revoke the two tokens** issued to Claude on 2026-09-02 (Vercel + Supabase PAT) and
   delete the `SUPABASE_ACCESS_TOKEN` line from `.env.local`. Still outstanding as of
   2026-09-03; the line is still in the file.
3. Read the **Session 5** handoff at the bottom of this file.
4. `git log --oneline -20` on `dev`. If this file and git disagree, trust git and
   fix this file. **Local `main` and local `dev` are both stale** — as of 2026-09-03
   local `main` sat 100+ commits behind `origin/main`. Compare against `origin/*`.

### Still open, in rough priority order

| | |
|---|---|
| **Tokens to revoke** | A Vercel token and a Supabase PAT were issued to Claude on 2026-09-02. **Revoke both**, and delete the `SUPABASE_ACCESS_TOKEN` line from `.env.local` — still present 2026-09-03. Now the top item |
| **Test coverage is thin** | vitest landed 2026-09-03 with 48 tests over the QR pass, the Zelle money path and the shared formatter. The `Tests` check is now live in the release gate. Everything touching Supabase, Stripe and the API routes is still untested |
| **No `ci.yml`** | `/govkit-doctor`'s one missing guardrail. `.github/workflows/` holds only `deploy.yml` and `sdlc-docs.yml`. Jobs must be named to match `release-gate.config.json`'s `ciJob` values |
| **Contrast** | White on `#c75b12` is 4.26:1, below WCAG AA's 4.5. `#b8530e` gives 4.90. One line in `app/globals.css`; a brand decision |
| **PII in git history** | Rewritten and branches deleted, but GitHub keeps orphaned commits reachable by SHA. Closes when the repo goes private, which is the plan. See DEC-010 |
| **SPF** | `hsnef.org` publishes three `v=spf1` records; RFC 7208 allows one |
| **Type errors** | Mostly local `interface` shapes drifted from `types/database.ts`. Real, not urgent |
| **Railway** | Parked. Analysis in [`docs/ANALYSIS-railway-migration.md`](ANALYSIS-railway-migration.md) |

## Architecture at a glance

Next.js 15 App Router · React 19 · Tailwind 3.4 · Supabase (auth + Postgres + RLS) · Stripe · Resend · Vercel.

- **71 user-facing routes**, 36 API routes. `/member/**` is authenticated-only;
  `/admin/**` requires a staff role.
- **Roles are an array** on the user (`user_roles` table): `Member | Office Staff | Office Manager | Admin`.
  Every staff member also holds `Member`. Never compare a single role field.
- **Gating is client-side** via `components/ProtectedRoute.tsx`. `middleware.ts` only refreshes the
  Supabase session; it performs no redirects.
- **Two token systems coexist in `app/globals.css`** and both are load-bearing — see DEC-001.

## Environments & deployment flow

**The flow (agreed 2026-08-31), and as of 2026-09-02 it is fully real end to end.
Nothing merges to `main` without a PR that Sujit merges.**

```
feature/*  ──►  dev  ──────────────►  PR  ──────────────►  main
                 │                  (Sujit merges on GH)     │
                 ▼                                           ▼
        Vercel  PREVIEW                              Vercel  PRODUCTION
        dev.member.hsnef.org                         member.hsnef.org
                 │                                           │
                 ▼                                           ▼
        Supabase dev-mp                              Supabase prod-mp
        (bcujsesgrzijyisvmnwm)                       (gapvsdrzavjaublwkqfm)
```

⚠️ **`gapvsdrzavjaublwkqfm` is PRODUCTION.** It was the single shared project before the
split and kept its ref, so anything written before 2026-09-02 shows it as dev. Dev is
`bcujsesgrzijyisvmnwm`. Confirm which ref `.env.local` holds before writing data.

1. Work lands on `dev` (directly, or via `feature/*`). Push to `dev` triggers the Vercel **preview** deploy.
2. Raise the PR `dev → main` immediately after pushing (`gh pr create --base main --head dev --fill`).
3. **Sujit merges on GitHub.** Claude never merges. The pre-push hook blocks direct pushes to `main`.
4. Merge to `main` triggers the Vercel **production** deploy.

✅ **Both former blockers are closed** — DEC-006 (shared database) on 2026-09-02, DEC-007
(Vercel could not deploy) on 2026-09-01.

## Key Decisions Log

> Record every architectural/product decision as `DEC-NNN`. Format: **Date · Decision · Why · Status**.

### DEC-001: Runtime theming and the design system both stay live
**2026-08-31 · Accepted.** The design kit's install instructions said to replace `app/globals.css`
outright. That would have deleted the `--theme-*` contract that `ThemeProvider` writes into and
Settings → Appearance edits, silently breaking every themed surface.
**Instead:** `globals.css` carries both token families. The seven semantically overlapping tokens
(`--canvas`, `--surface`, `--ink`, `--ink-2`, `--saffron`, `--kumkum`, `--line`) are *aliased* to
their `--theme-*` counterpart. Runtime theming still moves the design system, and un-ported pages
picked up the new palette for free. `hsnef` is registered as a built-in theme and is the default via
a single `DEFAULT_THEME_NAME` constant; `default` and `florida-oura` remain selectable.

### DEC-002: Colour-token opacity uses `color-mix()`
**2026-08-31 · Accepted.** Tailwind 3 cannot compose an alpha onto a colour defined as a bare
`var()`, so all 35 `token/opacity` classes in the kit components were silently emitting nothing —
including the login hero's `bg-kumkum/65` wash, which is why white text sat on an unwashed photo.
Hardcoding channel triplets would fix alpha but break DEC-001. The `token()` helper in
`tailwind.config.ts` emits `color-mix()` instead. **Colours only** — fonts, radii, shadows and
spacing stay plain `var()` strings. Browser floor: Chrome 111+, Safari 16.2+, Firefox 113+.

### DEC-003: The code is authoritative over `ROUTE_MAP.md`
**2026-08-31 · Accepted** (confirmed by Magic Patterns). `design-kit/docs/ROUTE_MAP.md` was written
against a pre-January snapshot: it lists 46 routes (there are 71), calls `/member/profile`,
`/member/family` and `/member/activity` dead links (all three are live pages, ~1,700 lines), points
at `/admin/purohits` (moved to `/admin/settings/priests`; the table is still `purohits`), and knows
nothing of Zelle, the theme system, the join/register funnel, audit logs or event registration.
Where kit docs and code disagree, **code wins**.

### DEC-004: Role gates were not tightened during the port
**2026-08-31 · Accepted.** `CLAUDE.md` and `ROUTE_MAP.md` claim `/admin/settings`,
`/admin/members/new`, `/admin/members/[id]/edit` and `/admin/members/import` are Office Manager +
Admin only. The code allows any staff role. That is a business decision, not a styling one, so the
port left it alone. The section layouts carry the **loosest** gate for their section; six routes
needing more keep their own nested `ProtectedRoute` (`login-activity` ×2, `portal-settings`,
`staff-roles`, `test-accounts`, `zelle/settings`). `/verify-qr` sits outside both sections.
**Nobody gained access they did not have.** The docs should be corrected to match the code.

### DEC-005: Unwrap JSX wrappers by swapping for fragments, never by deleting tags
**2026-08-31 · Accepted.** Deleting `<AdminLayout>` / `<ProtectedRoute>` tags corrupts any return
with multiple top-level siblings — it silently produced a parse error in
`app/admin/bookings/[id]/page.tsx`, and because `tsc` aborts its semantic pass on a syntax error the
error count *dropped* from 469 to 2 and briefly looked like a win. Swap the wrapper for `<>…</>`,
then collapse redundant nesting.

### DEC-006: All three environments currently share ONE Supabase project — must be split
**2026-08-31 · CLOSED 2026-09-02.** Resolved as the entry itself proposed: a NEW project became
`dev` (`dev-mp`, `bcujsesgrzijyisvmnwm`) and the existing `gapvsdrzavjaublwkqfm` stayed as
production (`prod-mp`), so not one real member row was migrated. Verified from the shipped JS
that each host resolves its own database. **Watch the ref confusion this leaves behind:**
`gapvsdrzavjaublwkqfm` reads as "the dev project" in everything written before the split.
Original entry follows.

**2026-08-31 · Open, blocking.** `docs/ENVIRONMENT_QUICK_REFERENCE.md` lists
`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` under "Same Across All Environments".
So **local, dev and production all read and write the same live member database**
(`gapvsdrzavjaublwkqfm`). Testing on `dev` mutates real member records; a bad migration run against
dev hits production; local development does too.

**Recommended direction — INVERT the obvious plan.** The instinct is to create a new *prod* project.
But the existing project holds the real member rows and the real `auth.users`, and is what
production serves today, so that direction means migrating live data and auth users **out** — the
risky half. Instead:

| | New project = prod | **New project = dev** (recommended) |
|---|---|---|
| Migrate real member rows | required | **none** |
| Migrate auth users | required, and hard | **none** |
| Production during cutover | at risk | **untouched** |
| Dev stops writing to live data | yes | yes |

Both reach the actual goal. The inverted one gets there without moving a single real row: the new
dev database comes up empty and seeds itself, because `20260108000005_test_accounts.sql` and
`20260110000001_add_test_admin_account.sql` are already migrations. Losing real data on dev is the
point, not a cost.

**Blocker to fix before any fresh `supabase db push`:** two pairs of migrations share a version
prefix, and the CLI orders by that prefix and rejects duplicates —
`20260108000004_{member_audit_log,test_accounts}.sql` and
`20260111000003_{event_rsvp_payable_flags,zelle_payment_system}.sql`. They applied fine to the
existing DB because they went in ad-hoc; a clean push to a new project will fail. Renumber two of
them — safe for a new database, must **not** be replayed against the existing one.

**Not carried by migrations, needs doing by hand:** `auth.users` (only referenced via FK/triggers),
storage bucket *contents* (the policies are in `20260111000002`, the event images are not), Site URL
and redirect allow-list, the Google OAuth client, SMTP. Afterwards re-point Vercel env vars per
environment, the Stripe webhook endpoints, and the Google OAuth redirect URI to the new project's
`/auth/v1/callback`.

Claude has the Supabase CLI (2.116.0) and can run `supabase link` + `db push` once the project
exists and it has the ref and DB password. Creating the project is a dashboard/billing action.

### DEC-007: Vercel Hobby cannot deploy this repo — do NOT solve it by going public
**2026-08-31 · CLOSED 2026-09-01 — and closed by the route this entry warned against.** The repo
was made public, which restored Vercel builds. That was accepted knowingly and the PII consequence
is tracked separately as DEC-010; the repo going private again is still the plan. Original entry
follows.

**2026-08-31 · Open, blocking.** Both Vercel checks fail on the PR with *"Cannot deploy from a
private GitHub organization repository on the Hobby plan."* Hobby allows private **personal** repos,
not private **organization** repos, and `hsnef` is an org.

**Making the repo public is not a safe workaround.** A history audit on 2026-08-31 found:
- ✅ **No real secret has ever been committed.** Every `sk_*` / `whsec_*` / `sb_secret_*` match in
  the full history is ≤32 chars and placeholder-shaped, confined to `.example` files and setup docs.
  No `.env` was ever committed; no JWT-shaped Supabase keys.
- ❌ **Real member PII is committed**, and going public exposes all history, not just HEAD:
  `docs/reference/data/current-member-data-import-template.csv` and `…-v2.csv` hold **6 households**
  — surnames, partner names, **children's names**, gotra, two email addresses, three phone numbers
  and a home address each. Added in `77fdbef` (2026-01-10).

Publishing children's names and home addresses of temple members is not an acceptable trade for a
CI convenience. Separately, Vercel's Hobby plan is for non-commercial use; a member portal taking
Stripe payments is arguably commercial, so Hobby is likely the wrong plan regardless of visibility.

**Options, narrowed 2026-08-31:**

| Option | Cost | Status |
|---|---|---|
| Move projects to the existing **Techsilon** Pro team (`team_fM7R8KAWiXHikgrsEtaIoArc`) | £0 — Pro is per-seat, projects unlimited | ❌ **RULED OUT by Sujit** — cannot move them there |
| **Vercel Pro** on the account that owns `member` / `dev.member` | ~$20/mo | ⏳ Sujit seeking purchase permission. Ask about the nonprofit discount. |
| Deploy from **GitHub Actions with a Vercel token** instead of the Git integration | £0 | 🔍 Unexplored, and the most promising free path. `.github/workflows/deploy.yml` **already exists for exactly this** but is `disabled_manually` and failed every run since Jan 2026. The Hobby restriction applies to the *Git integration*; CLI deploys are a different route. Caveat: Hobby is licensed for non-commercial use, and a portal taking Stripe payments is arguably commercial — so this may be a technical workaround for a licensing problem, not a fix. Check the ToS before relying on it. |
| Make the repo public | £0 | ❌ Not without purging the member-PII CSVs from history first (rewrite + force-push, needs explicit go-ahead). Also does not resolve the commercial-use question. |

**Consequence while unresolved: nothing deploys.** Pushing to `dev` updates GitHub only. The
`dev.member.hsnef.org` and `member.hsnef.org` sites are serving whatever was last successfully
deployed, and will keep serving that until this is fixed.

### DEC-008: The Supabase schema failed to resolve for three stacked reasons
**2026-09-01 · Fixed.** Not "types out of sync". (a) Ten tables were queried in
code but never declared in `Database['public']['Tables']`. (b) `Row: <interface>`
can never satisfy postgrest-js's `Record<string, unknown>` — TypeScript gives
implicit index signatures to type ALIASES, not INTERFACES — so every table failed
`GenericTable` and the whole schema collapsed. (c) `@supabase/ssr` 0.5.2 predates
`supabase-js` 2.89 and drops the `Database` generic; proven by comparison, since
supabase-js's own `createClient` resolved correctly while ssr's did not.

The `never` epidemic went from 418 occurrences to 1. For the current error
count run `npx tsc --noEmit` — do not trust a number written here.
**A caution:** 78f49c1's message and an earlier version of this file both said
"469 -> 159". The 159 was a mis-measurement and is wrong; re-measured on the
same commit with the same command it is 209. Treat the direction as real and
the figures as unreliable. **Open:** upgrade `@supabase/ssr` and remove
the return-type annotations in `lib/supabase/{client,server}.ts`. That package
handles PKCE cookies, so it needs its own testing pass.

### DEC-009: the events feature could not work against this database
**2026-09-01 · RESOLVED 2026-09-02.**

Migration `20260901000001_events_align_with_application.sql` was applied to BOTH
projects. The prod and dev `events` tables are now identical at 26 columns, and
the queries that returned 400 return 200. Both tables were empty, so nothing had
to be migrated. Original diagnosis follows.

Verified with live queries, not inferred:

```
GET /events?status=eq.Published  -> 400  column events.status does not exist
GET /events?select=event_name    -> 400  column events.event_name does not exist
GET /events?select=id,name       -> 200  []
```

The `events` table — in the live database AND in every migration in this repo —
has `name`, `description`, `event_date`, `event_time`, `location`,
`registration_required`, `registration_opens_at`, `registration_closes_at`,
`max_attendees`, `price_per_person`, `member_discount_percent`, plus
`short_description`, `rsvp_enabled`, `is_payable` added later.

Every events page instead uses `event_name`, `category`, `max_capacity`,
`member_price`, `non_member_price`, `registration_deadline`, `status`,
`image_url`, `contact_email`, `contact_phone`. **None of those columns exist
anywhere.** So `/member/events`, `/admin/events`, event creation, editing and
registration all fail with a 400.

This is pre-existing and predates the design-system port. It was invisible
because the `never` types hid it from the compiler and the pages catch their
errors and render an empty state — a broken feature looks like "no events yet".

**The decision, which is not Claude's to make:** either write the missing
migration to bring the table up to what the code expects, or change the code
back to the columns that exist. It depends on whether events ever worked in
production and what data is in the prod table. **Check production before
choosing.** Until then, treat events as non-functional.

## Session Handoff

> **Handoffs below are point-in-time.** Each records what was true on its date and
> is deliberately not updated — earlier ones still say the app had not deployed
> since January, which stopped being true on 2026-09-01. Read them as history;
> Current Status at the top of this file is the live view.

### DEC-010: member PII was committed, and served without authentication
**2026-09-01 · Fixed going forward; the history is NOT clean.**

`public/member-import-template.csv` held six real households — children's names,
home addresses, emails, phone numbers. `/public` is served verbatim by Next, so
`GET /member-import-template.csv` returned it with **HTTP 200 and no auth on any
deployment**, whether or not the repo was public. Verified live before changing
it. `/admin/members/import` links to it as the example download.

Fixed: its 42 columns kept, rows replaced with two obviously synthetic ones.
`docs/reference/data/current-member-data-import-template*.csv` untracked and
gitignored; they stay on disk for whoever runs an import.

**History rewritten 2026-09-02.** `git filter-repo` stripped the three CSV paths
from all 101 commits. `dev`, `redesign/design-system` and `main` were force-pushed
(main's content is byte-identical; only SHAs changed, and the pre-push hook was
bypassed once with explicit approval). Two branches that still carried the data
were deleted: `backup/pre-pii-rewrite` and — found only by sweeping every remote
branch — `feature/theme-system`, a stale branch merged back in PR #1. The CSVs now
appear in **no** published branch.

**STILL EXPOSED, and this is the important part.** GitHub does not delete orphaned
objects on a force-push. Verified immediately afterwards:

```
GET raw.githubusercontent.com/hsnef/member-portal/77fdbef.../current-member-data-import-template.csv
  -> HTTP 200
```

The old commits remain fetchable by exact SHA until GitHub garbage-collects them.
**To actually close this:** ask GitHub Support to purge the cached views and run
gc on the repository (they do this routinely for exposed secrets), or make the
repo private, which immediately blocks anonymous access to those SHAs.

Mitigating: the repo was public for roughly one day, and had 0 forks and 0 stars
when checked. An attacker would also need the exact SHA. Treat the six households'
data as exposed regardless, and treat any key ever committed as compromised.

A complete copy of the pre-rewrite history is bundled OUTSIDE the repo at
`<scratchpad>/pre-pii-rewrite.bundle` (1.9 MB, `git bundle verify` passed). It
contains the PII, so it must not be committed anywhere.

The import feature itself was already safe and is unchanged: the CSV is parsed in
the browser with PapaParse and rows go straight to Supabase, so an uploaded sheet
never touches the server or the repo.

### DEC-011: the login page created an account for any address typed
**2026-09-01 · Fixed.** `signInWithOtp` defaults to `shouldCreateUser: true`.
Memberships are created by the office, never by the portal, so an account made
this way could never be linked — `/api/auth/link-member` 404s — and had no way to
fix itself. It is how the stranded `gsujit@hotmail.com` account came to exist.

`/api/auth/check-member-email` now gates it, allowing an address only if a member
record exists **or** an auth account already does. **Both arms are required:**
`gsujit@gmail.com` holds no member record, so a member-only rule would have
locked Sujit out of his own dev environment. Fails open — a broken lookup must
not lock everyone out. It is a client-side gate; closing it fully needs a
Supabase auth hook, which is dashboard configuration.

Related: 18 of 21 member routes had no "no membership" state and rendered against
a null member. Nine reachable ones now share `NoMembershipState`.

### Session 7 — 2026-09-03 — magic-link-only; both auth defects fixed

Decision taken (Sujit): **the portal is magic-link-only.** Both defects from the
Session 6 audit are fixed.

**What the investigation changed about the fix.** The first plan was to strip the
password field from `/register`. Reading the flow made that wrong twice over:

- `signUp` needs a password, so removing the field meant moving to OTP signup —
  which returns no user until the link is clicked, and `/register` needed
  `user.id` synchronously to link the member record.
- Then the better answer appeared: **none of that work was needed.** Both jobs
  `/register` did already happen on an ordinary magic-link sign-in.
  `lib/auth/AuthContext.tsx` calls `/api/auth/link-member`, which matches on
  email and bypasses RLS; `TermsAcceptanceModal`, rendered by `PortalShell`,
  records `first_login` acceptance. The password path was pure redundancy.

So `/register` is now a page that explains how to get in — sign in if you are a
member, `/join` if you are not — and calls no auth API at all. It was also the
only page still carrying hardcoded hex in `className`, so it moved onto tokens.

`/admin/test-accounts` "Reset password" became **"Send sign-in link"**. It used
to call `resetPasswordForEmail` with `redirectTo: /auth/reset-password`, a route
that does not exist. Rather than delete the button, it now sends the thing that
actually signs someone in.

**A guard test rather than a note.** `app/auth-redirects.test.ts` fails if any
`redirectTo`/`emailRedirectTo` in `app/` points at a route that does not exist,
and if `signInWithPassword` reappears. Verified by reintroducing the original bug
and watching it fail with the file and path named. It reads source, so it needs
no jsdom. Two of its checks first failed against their own explanatory comments —
it now strips comments before matching.

**Corrected from Session 6:** that entry said `/auth/callback-handler` was the
only route under `/auth/`. Wrong — `/auth/callback` exists as a route handler,
and a `page.tsx`-only route scan missed it. `/auth/reset-password` is genuinely
absent, so the defect stood.

**Still open, newly recorded:** hardcoded hex in `className` in 8 files, which
rule 3 forbids and the "port complete" note did not account for. Recorded in
`docs/PRIORITY-ROADMAP.md` Tier 1.5 with the command to find them.

Type errors fell 137 → 132, entirely from deleting the register page's password
code (it had exactly 5). No parse abort — checked, per DEC-005.

### Session 6 — 2026-09-03 — full docs audit; two auth defects found

Audited all 69 files under `docs/` against the code. Rather than reading 25,000
lines linearly, every checkable claim was extracted and verified: 107 routes from
`app/`, the role gates, `types/database.ts`, `package.json` scripts, migration
filenames, and every relative link and file reference.

**20 docs were wrong. All are now fixed or bannered.** The rule going forward,
recorded in `docs/README.md`: a doc with no banner is meant to be current — if it
is not, fix it or banner it in the same change.

**Two defects in the code, not the docs. Neither was fixed** — both are auth
business logic, which rule 2 puts off-limits without asking:

1. **A password is set at registration that can never be used.** `/register`
   calls `supabase.auth.signUp` with a password, but the login page has no
   password field under any setting — it calls only `signInWithOtp` and
   `signInWithOAuth`, and tells the user "no password to remember".
   `signInWithPassword` survives only inside `loginWithMembershipNumber()` in
   `lib/auth/helpers.ts`, which nothing calls.
2. **`/admin/test-accounts` → "Reset Password" sends mail whose link 404s.** It
   calls `resetPasswordForEmail` with `redirectTo: /auth/reset-password`. That
   route does not exist. (An earlier draft of this entry said `/auth/callback-handler`
   was the only route under `/auth/`. That was wrong — `/auth/callback` exists as a
   route handler, and a `page.tsx`-only route scan had missed it. `/auth/reset-password`
   is genuinely absent, so the defect stands.)

Related: the portal setting **`enable_traditional_login` does not do what its
name says.** It reveals one link on the login page ("Existing member without
portal access? Create a portal account" → `/register`). It adds no password
field. Two feature guides described it as enabling password login.

**What the audit found, by class:**

- **`ONBOARDING.md` named the production database as dev** — the doc a new
  developer reads first, granting them access to live member data on day one.
  Same class as the `CLAUDE.md` error fixed in `3768f8e`.
- **Four testing guides instructed testers to sign in with passwords**, which
  would have blocked them at step one, and contradicted `ROLES-GUIDE.md`.
- **Five setup docs pointed at `gapvsdrzavjaublwkqfm`** as the project to
  configure — that is production since the split.
- **`architecture/architecture.md` is a foundation-era document** presented as
  current architecture: "Not included: Stripe integration code, email templates,
  QR generation" (all built), 18 tables (now 30), three auth methods (two do not
  exist). Bannered rather than rewritten.
- **Migration filenames in seven docs were invalidated by our own release** —
  `71f6811` swapped the two test-account prefixes so the constraint runs before
  the seed. One was inside a runnable `supabase db push` command.
- **Ten variables documented across six setup docs are read by nothing**:
  `NEXTAUTH_SECRET`, `JWT_SECRET`, `OPENROUTER_*`, `SMTP_*`, `SESSION_*`,
  `NEXT_PUBLIC_ENABLE_*`, `DATABASE_URL`, two Stripe price IDs.
- **`docs/README.md` was missing 12 docs**, including the three that
  `ONBOARDING.md` tells a new developer to read.

**A roadmap item was itself wrong and has been struck.** Tier 3 said to sweep
"~26 `portal.hsnef.org` occurrences presented as current". Of 30, **29 are
correct** — they are the verified Resend sending domain. Actioning that item
would have broken email.

### Session 5 — 2026-09-03 — the launch blocker cleared; four docs reconciled

A `/sdlc status` read, no code changed.

**`member.hsnef.org` came up.** The Cloudflare handoff from session 4 worked and nobody
reported back, so every doc still said production was down. Sujit produced the DNS
screenshot: `member` CNAME → `b71df0496b881ead.vercel-dns-017.com`, **Proxy status: DNS
only**. Verified independently — `200` / `Server: Vercel`, resolving to Vercel anycast
`64.29.17.1` / `216.198.79.1`, and the shipped stylesheet carries `--saffron --kumkum
--tulsi --marigold`. Neither an SSL/TLS mode change nor a redirect-rule edit was needed;
the orange cloud was the whole bug.

**What the doc-drift check caught.** `docs/PRIORITY-ROADMAP.md` and `CLAUDE.md` both
declared 2026-08-31 against code that moved 2026-09-02. Reconciled:

- **`CLAUDE.md` was actively dangerous.** Its environment table listed
  `gapvsdrzavjaublwkqfm` under `dev`. That ref is *production* — it was the shared
  project and kept its ID through the split. Anyone building a local env from CLAUDE.md
  would have pointed dev at live member data, the exact failure DEC-006 was closed to
  prevent. Fixed, with a warning note, in CLAUDE.md and in this file.
- **This file passed the freshness check and still contradicted itself.** Its date was
  current while *Environments & deployment flow*, sixty lines below Current Status, still
  showed prod Supabase as "TO BE CREATED" and closed with "⚠️ Two blockers, both open."
  **A fresh date is not freshness** — `docs:sync-check` compares dates, not claims.
- Five roadmap items described finished work: Phase 2 and Phase 3, the Supabase split,
  the `userData` bug in the admin bookings pages (zero occurrences remain), and stage 8.
- **Three files quoted three different type-error counts** — the roadmap said 469, this
  runbook said 187, `release-gate.config.json` said 469, and only this file said "run the
  command". They all point at `npx tsc --noEmit` now. Measured this session: 137 errors
  under `app|components|lib|utils|types`, 191 total, the remaining 50 in
  `tailwind.config.ts`. No `TS1xxx` parse abort, so the fall is real, not `tsc` aborting
  the way DEC-005 describes — but per DEC-008's caution, treat the direction as the
  finding and every figure as perishable.

**Not done, deliberately:** the two tokens from session 4 are still live and
`SUPABASE_ACCESS_TOKEN` is still in `.env.local`. That is now the top open item.

**Also worth knowing:** local `main` sat at `3ee148c` while `origin/main` was at
`7a67505` — 100+ commits behind. Local `dev` was stale too. `redesign/design-system`,
`origin/dev` and `origin/redesign/design-system` are all level at `2ab5dac`.

### Session 4 — 2026-09-02 — infrastructure consolidated, environments separated

The portal went from "built but undeployable" to "deployed, separated, and one
DNS change from public".

**Done, in order:**

1. **PR #3 raised, then replaced by PR #4** after the PII history rewrite
   force-pushed `dev` and GitHub auto-closed #3.
2. **PII history rewrite** (DEC-010). `git filter-repo` over 101 commits. A sweep
   of every remote branch found the data also on `feature/theme-system`, a stale
   branch merged in PR #1 — deleting only the intended backup would have missed
   it. **GitHub still serves the old commits by SHA**; that closes when the repo
   goes private.
3. **Login hardened** (DEC-011). `signInWithOtp` was creating an account for any
   address typed. Now gated on an existing member record *or* an existing auth
   account — both arms needed, since `gsujit@gmail.com` holds no member record and
   a member-only rule would have locked Sujit out. Google OAuth cannot be gated
   the same way, so `AuthContext` signs out an account holding neither membership
   nor role *after* the callback.
4. **Roles fixed.** All four are now held and testable. The fixtures were
   half-built since January: `Test Manager` had a member row and an auth account
   never linked; `Test Staff` had a member row and no auth account.
5. **Vercel consolidated to one project.** The failing project had **zero
   environment variables** — not wrongly scoped, none. Retired as `member-legacy`
   with its git link removed rather than deleted.
6. **PR #4 merged.** Production live on the design system.
7. **Supabase split** (DEC-006 closed). `prod-mp` keeps `gapvsdrzavjaublwkqfm`;
   `dev-mp` is `bcujsesgrzijyisvmnwm`, built from all 28 migrations and verified
   identical — 30 tables each side, RLS on all 30.
8. **Events fixed** (DEC-009 closed). Migration applied to both projects; the
   queries that returned 400 return 200.

**Three bugs found that had never surfaced before:**

- **The migrations had never built a database from scratch.** `test_accounts`
  inserted `9xxxxxxx` membership IDs one migration *before*
  `update_constraints_for_test_accounts` relaxed `chk_membership_id_format`.
  Failed with `23514`. Only appeared the first time a second environment was
  created. Swapped.
- **Two pairs of migrations shared a version number**, which Supabase treats as a
  primary key — a `db push` to any new project would have been rejected outright.
  Renumbered, dependency order verified.
- **`CRON_SECRET` and `ZELLE_TOKEN_SECRET` were absent from Vercel entirely**, so
  the nightly cleanup silently errored, and Zelle fell back to `QR_TOKEN_SECRET`
  — and past that, to a literal string committed in a public repo.

**Two mistakes worth remembering:**

- I told Sujit `main` would be untouched by the history rewrite. It could not be —
  rewriting `dev` renumbers `main`'s commits too, since they are its ancestors.
  He had to approve a second force-push mid-operation.
- I twice reported member records as missing when they existed. A `+` in an email
  decodes as a space in a URL query, so `dev-mp+teststaff@hsnef.org` never
  matched. **Query by `auth_user_id`, or encode the `+`.**

**Useful things learned about the tooling:**

- The Supabase Management API returns Cloudflare `error code: 1010` — not a
  Postgres error — if the request carries no `User-Agent`.
- Vercel's API silently ignores `productionBranch`; it must be set in the
  dashboard, under **Settings → Environments → Production**, not Settings → Git.
- On Vercel's domain editor, connecting a domain to Preview leaves **Save greyed
  out** until an actual branch is picked. "All Branches" is placeholder text.
- To see why a Vercel build failed, list env var *targets* via the API. A missing
  environment tick is invisible in the dashboard and produces
  `@supabase/ssr: Your project's URL and API key are required`.

### Session 3 — 2026-09-01 — port complete, docs synced, types fixed

**The design-system port is DONE.** Stages 1-8: tokens, primitives, colour
sweep, shell, login, 21 member routes, 40 admin routes, and the non-React
surfaces (emails, PDFs, Stripe). Every page in the app is on the system.

**The Supabase schema resolves again** and `never` went 418 -> 1. See DEC-008 —
including why the "159" figure quoted in that commit is wrong.

**Nine bugs found and fixed**, all previously invisible because
`next.config.ts` sets `ignoreBuildErrors` and every one was reported by the
type checker nobody was reading:

| # | Bug | Effect on live data |
|---|---|---|
| 1 | `userData` misread, /member/bookings | list always empty |
| 2 | same, /member/bookings/new | bookings saved with `member_id: null` |
| 3 | same, /admin/bookings/[id] | `reviewed_by: null` — no record of who approved |
| 4 | same, /admin/bookings/new | as above, for walk-ins |
| 5 | `address_line1` typo | receipts issued with no member address |
| 6 | `const memberId = memberId` | two admin pages threw and had NEVER rendered |
| 7 | Zelle settings | could save "enabled" with nowhere to send money |
| 8 | QR check-in | wrote to a non-existent table, wrong enum, wrong column |
| 9 | TermsAcceptanceModal + TestDataToggle | lost when AdminLayout was deleted — **I caused this one**, and the docs review caught it |

**Found but NOT fixed — needs your decision:**
- **DEC-009: the events feature cannot work.** Read it before touching events.
- **White on `#c75b12` is 4.26:1, below WCAG AA's 4.5** for normal text. The
  design kit claimed it passes; it does not. Darkening `--saffron` to about
  `#b8530e` gives 4.90 and is nearly imperceptible. One line in
  `app/globals.css`; it propagates to emails and PDFs too. Brand colour, so
  it is Sujit's call.
- `hsnef.org` publishes THREE `v=spf1` records; RFC 7208 allows one.

**Still true:** nothing has deployed since January (DEC-007). Pushing to `dev`
updates GitHub only.

### Session 2 — 2026-08-31 — govkit guardrails + deployment audit

**Shipped:** `chore(govkit): scaffold engineering guardrails` (`63030ca`). All 6 guardrails declared,
none skipped; `ci` is reported missing by `/govkit-doctor` because govkit does not scaffold
`ci.yml`. Release gate verified GREEN; pre-push hook verified *actually blocking* `main` with a
probe commit, and verified not blocking the working branch.

**`dev` fast-forwarded to `63030ca`** (38 ahead of `main`, 0 behind). `redesign/design-system` is
level with it.

**Findings — three things that were not true of this repo as assumed:**
1. **Nothing has deployed since January.** `.github/workflows/deploy.yml` is `disabled_manually` and
   had failed every run before that, so deploys depend entirely on Vercel's Git integration — which
   Hobby blocks for private org repos. Pushing to `dev` now updates GitHub and nothing else.
2. **A Vercel Pro team already exists** (`Techsilon`), but Sujit confirmed the HSNEF projects
   **cannot** be moved to it. See the table in DEC-007 for what remains.
3. **The migration set cannot be cleanly pushed to a fresh project** as-is — duplicate version
   prefixes. See DEC-006.

**Open, needs Sujit:**
- The Vercel plan question (DEC-007). Until then, nothing deploys.
- PR **#2** is `redesign/design-system → main`, which skips `dev` and would ship a half-finished
  redesign straight to production. Under the agreed flow it should be `dev → main`, and not until
  the port is further along. Left open pending a decision — **do not merge it as-is.**
- The two member-PII CSVs are still committed. Deleting them from HEAD was offered and not yet
  actioned.

**Next step:** resolve the Vercel plan, then the Supabase split (inverted, per DEC-006). The
design-system port resumes at stage 6, `/member`.

### Session 1 — 2026-08-31 — design-system port, stages 1–5 of 8

**Shipped** (11 commits on `redesign/design-system`, pushed):

| Stage | | |
|---|---|---|
| 1 | Tokens — palette, fonts, `hsnef` theme as default | ✅ |
| 2 | Primitives — 23 UI components, brand marks, router seam, `RoleGate` | ✅ |
| 3 | Colour sweep — 929 hardcoded hex → tokens across 83 files | ✅ |
| 4 | Shell — `PortalShell` replaces `AdminLayout` (deleted, 376 lines) | ✅ |
| 5 | `/login` redesigned | ✅ |
| 6 | Member screens (21 routes) | ⬜ **next** |
| 7 | Admin screens (~40 routes) | ⬜ |
| 8 | Non-React — emails, PDFs, Stripe appearance | ⬜ |

Also: fixed an unprotected `/admin/portal-settings` (no `ProtectedRoute`, no inline check, and
middleware does not redirect — the URL was reachable by anyone).

**What a user sees today:** new palette, Instrument Sans/Serif and the new navigation shell
**everywhere**; `/login` fully redesigned; **~70 page interiors still on the old layouts.** The
member section previously had no navigation at all.

**State:** build clean, type errors unchanged at the 469 baseline, working tree clean, branch pushed.

**Next step:** stage 6, starting with `/member`. Follow the pattern established by `/login` —
`page.tsx` keeps all logic and maps rows to view models; a sibling presentational component takes
plain props. See `app/login/page.tsx` + `components/auth/LoginView.tsx`.

**Two bugs this session were invisible to both build and typecheck** and were caught only by looking
at the rendered page (the 404'd stylesheet, and DEC-002). Open a browser before believing a green
result.
