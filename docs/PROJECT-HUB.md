# HSNEF Member Portal — Project Hub

> The single source of truth for architecture decisions, current state, and session-to-session context. `/sdlc status` reads this file. Keep it current — a stale hub poisons the next session's context.

_Last checked 2026-08-31._

## Current Status

- **Stage:** Live. `main` → https://member.hsnef.org, `dev` → https://dev.member.hsnef.org.
  A design-system redesign is in flight on `redesign/design-system` (branched off `dev` at `1df4acd`).
- **Health:** tests **none installed** · build **clean** (85/85 pages) · lint **failing** (pre-existing) ·
  types **~469 pre-existing errors** · CI ok. See [`release-gate.config.json`](../release-gate.config.json)
  for which of these actually gate today and why.
- **Now:** design-system port, stages 1–5 of 8 complete. Next: stage 6, member screens.

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

**The intended flow (agreed 2026-08-31). Nothing merges to `main` without a PR that Sujit merges.**

```
feature/*  ──►  dev  ──────────────►  PR  ──────────────►  main
                 │                  (Sujit merges on GH)     │
                 ▼                                           ▼
        Vercel  PREVIEW                              Vercel  PRODUCTION
        dev.member.hsnef.org                         member.hsnef.org
                 │                                           │
                 ▼                                           ▼
        Supabase hsnef-member-portal-dev             Supabase hsnef-member-portal-prod
        (gapvsdrzavjaublwkqfm)                       (TO BE CREATED)
```

1. Work lands on `dev` (directly, or via `feature/*`). Push to `dev` triggers the Vercel **preview** deploy.
2. Raise the PR `dev → main` immediately after pushing (`gh pr create --base main --head dev --fill`).
3. **Sujit merges on GitHub.** Claude never merges. The pre-push hook blocks direct pushes to `main`.
4. Merge to `main` triggers the Vercel **production** deploy.

⚠️ **Two blockers, both open — see DEC-006 and DEC-007.**

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
dev database comes up empty and seeds itself, because `20260108000004_test_accounts.sql` and
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

469 → 159 errors; `never` 418 → 1. **Open:** upgrade `@supabase/ssr` and remove
the return-type annotations in `lib/supabase/{client,server}.ts`. That package
handles PKCE cookies, so it needs its own testing pass.

### DEC-009: THE EVENTS FEATURE CANNOT WORK AGAINST THIS DATABASE
**2026-09-01 · OPEN, not fixed. Needs a product decision.**

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

### Session 3 — 2026-09-01 — port complete, docs synced, types fixed

**The design-system port is DONE.** Stages 1-8: tokens, primitives, colour
sweep, shell, login, 21 member routes, 40 admin routes, and the non-React
surfaces (emails, PDFs, Stripe). Every page in the app is on the system.

**Type errors 469 -> 159**, `never` 418 -> 1. See DEC-008.

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
