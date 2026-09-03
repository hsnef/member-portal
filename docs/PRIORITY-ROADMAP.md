# HSNEF Member Portal — Priority Roadmap

> What to work on next, and why. Start each session by reading this + `gh issue list`. This file captures the WHY and ORDER; GitHub Issues capture the WHAT and STATUS.

## START HERE

> ## ✅ The infrastructure work is finished — 2026-09-02
>
> **The portal is live at https://member.hsnef.org.** There is no infrastructure
> blocker left. Do not restart
> [`docs/RUNBOOK-infra-consolidation.md`](RUNBOOK-infra-consolidation.md) — phases 1, 2,
> 3, 5 and 6 are ticked, and only Phase 4 (test-data cleanup) remains, which is optional.
>
> - **Cloudflare (Phase 2) is done.** The `member` record is a CNAME to
>   `b71df0496b881ead.vercel-dns-017.com` with **Proxy status: DNS only**. Verified
>   2026-09-03: `200`, `Server: Vercel`, Vercel anycast IPs.
> - **Databases are split.** Dev is `dev-mp` (`bcujsesgrzijyisvmnwm`); production is
>   `prod-mp` (`gapvsdrzavjaublwkqfm`). **That second ref is PRODUCTION** — it was the
>   shared project and kept its ID, so anything written before 2026-09-02 shows it as dev.
> - **Events migration (Phase 3) is applied to production.**

**The next three things, in order:**

1. **Revoke the two tokens** issued to Claude on 2026-09-02 (a Vercel token and a
   Supabase PAT) and delete the `SUPABASE_ACCESS_TOKEN` line from `.env.local`. Still
   outstanding as of 2026-09-03.
2. ~~**Install a test framework**~~ ✅ **Done 2026-09-03** — vitest, 48 tests, and the
   `Tests` check enabled in the release gate. Extend it; see Tier 2.
3. **Add `.github/workflows/ci.yml`** (Tier 2) — `/govkit-doctor`'s one missing guardrail.

## Current Priority Tiers (as of 2026-09-03)

### Tier 0 — EMPTY as of 2026-09-03

**Nothing is blocking.** All three items below closed between 2026-09-01 and 2026-09-02.
They are kept struck through because each one's reasoning still explains why the current
setup looks the way it does. The live work is in Tier 1 and Tier 2.

- ~~**Restore deployment (DEC-007).**~~ **RESOLVED 2026-09-01** — the repo was made
  public, Vercel builds again, and both `dev.member.hsnef.org` and `member.hsnef.org` are
  live on the design system. The repo is staying public for now, which keeps the PII
  history readable (DEC-010). Vercel project consolidation finished 2026-09-02: one
  project, `member`.
  Superseded text follows:
- **Restore deployment (DEC-007). Nothing has deployed since January** — the Actions workflow is
  disabled and Vercel's Git integration is blocked for private org repos on Hobby. Moving the
  projects to the existing Techsilon Pro team is **ruled out**. Remaining: buy Pro on the owning
  account (permission pending — ask about the nonprofit discount), or investigate re-enabling
  `deploy.yml` to deploy via the Vercel CLI with a token, which sidesteps the Git-integration
  restriction but may not sidestep Hobby's non-commercial licensing. **Do not fix this by making the
  repo public** — see the PII item below.
- ~~**Split the Supabase projects (DEC-006).**~~ **RESOLVED 2026-09-02** — done exactly as
  proposed: the NEW project became `dev` (`dev-mp`, `bcujsesgrzijyisvmnwm`) and
  `gapvsdrzavjaublwkqfm` stayed as production (`prod-mp`), so no real member row moved.
  **Remember that `gapvsdrzavjaublwkqfm` is therefore PRODUCTION**, not dev, despite how
  every pre-split note reads. Superseded text follows:
- **Split the Supabase projects (DEC-006).** All three environments share one live database today,
  so dev testing writes to real member data. **Make the NEW project `dev`, not prod** — that reaches
  the same goal without migrating a single real member row or auth user, and leaves production
  untouched. Renumber the two duplicate migration prefixes first or the fresh `db push` will fail.
- ~~**Remove the member-data CSVs regardless.**~~ **RESOLVED 2026-09-02** in `305c5e1`
  *"fix(privacy): remove real member households from the repo"*. The two
  `docs/reference/data/current-member-data-import-template*.csv` files still exist but now
  carry synthetic rows (`904-555-*` numbers). **Purging real data from git history is still
  open** — see DEC-010, which closes when the repo goes private.

### Tier 1 — now

- ~~**Fix the `userData` bug in the two remaining admin files.**~~ ✅ **Done** — verified
  2026-09-03: `grep -rn userData app/admin/bookings/` returns nothing. Fixed during
  stage 7 as planned. What it was, for the record: `useAuth()` has no `userData`, so
  `userData?.user?.id` was always undefined in `app/admin/bookings/new/page.tsx` and
  `app/admin/bookings/[id]/page.tsx`; beyond the failed member lookup it fed
  `reviewed_by`, so **the record of who approved or rejected a booking was written as
  null.** (`app/admin/members/import` also has a `userData`, but it is a local from a real
  `supabase.auth.getUser()` call — that one was always fine.)
- ~~**Design-system port, stage 6: member screens (21 routes).**~~ ✅ **Done.**
  Previous plan, kept for reference:
  Order: `/member` → `/member/pass` → `/member/profile` → `/member/payments` → `/member/donate` →
  `/member/renew` → `/member/bookings/new` → `/member/bookings` + `/member/requests` →
  `/member/bookings/[id]` → the payment/success routes → `/member/events`.
  One route per commit. Exemplar map below.
- ~~**Stage 7** (admin, 40 routes)~~ ✅ **Done.**
- ~~**Stage 8** — the non-React surfaces~~ ✅ **Done 2026-09-01.** The design-system port
  is complete, stages 1–8. `lib/email/theme.ts` and `lib/pdf/theme.ts` now restate the
  tokens for the surfaces that cannot read CSS variables — **change them together with
  `app/globals.css`.**
- **Review everything under `docs/` for alignment (agreed with Sujit 2026-09-01).**
  Partly done 2026-09-03 — this file, `CLAUDE.md`, `docs/PROJECT-HUB.md` and the two
  runbooks were reconciled. The rest of `docs/` has not been swept.
  Any design element, colour, route, screenshot or component name referenced in documentation
  must match what the code now does. Remaining known drift: the ~26 `portal.hsnef.org`
  references, and the role-gate tables that disagree with the code (DEC-004).
  **Already fixed:** `#FF9933` is gone from `lib/constants/temple.ts` (it is `#c75b12`
  now) and survives only in `lib/themes/themes/built-in/default.ts`, which IS the legacy
  palette by definition — verified 2026-09-03. `CLAUDE.md` rule 9 now describes the
  `docs/status/**` move correctly.

**Blocked on Sujit:**
- ~~`tailwind-merge` dependency approval.~~ ✅ **Approved and done 2026-09-03.** `utils/cn.ts`
  is backed by `twMerge`, with 12 tests. Verified no visual change on the public routes by
  diffing rendered class attributes before and after; authenticated pages were not checked.
- **Real temple opening hours** — not in `lib/constants/temple.ts`. The login hero and the shell's
  office card both want them and currently show the office phone instead. Inventing hours on a
  sign-in page was not acceptable.
- **A real photo of the temple.** `public/images/temple-hero.{webp,jpg}` is AI-generated, not the
  Greenland Road building. Members will recognise that. **Replace before production.**
- Next.js dev overlay reported "1 Issue" on `/login`; not yet diagnosed.

### Tier 2 — next (high-value, start-ready)

- ~~**Regenerate `types/database.ts` from Supabase.**~~ **Largely done** — `9f9fb37`
  *"fix(types): make the Supabase schema resolve"* and `4e024be` (events schema) landed it,
  and the bulk of the errors went with it. What remains is the long tail the stale schema
  was hiding: local `interface` shapes that drifted. Measure before you start, and read
  the "Type gate" note above rather than any number in this file. Original framing follows,
  because its argument still holds:

  **AGREED with Sujit 2026-09-01: do this at the END of the design-system port, before
  anything else.** Most of the type errors trace to this one stale file — every
  insert/update resolves to `never` — and that noise is what makes the rest unreadable.

  This is not cleanup. **The type checker has been reporting live defects all along and nothing was
  reading its output.** Five bugs found during stage 6-7 were each visible to it:
  the `userData` misreads (empty bookings list, `member_id: null` on new bookings,
  `reviewed_by: null` on approvals), the `address_line1` typo (receipts issued with no address), and
  `const memberId = memberId` (two admin pages that threw ReferenceError and had never rendered).
  `next.config.ts` sets `ignoreBuildErrors`, so the build surfaced none of them.

  Doing it will surface more. Treat that as the point, not a setback. Afterwards, move `Type check`
  out of `_disabledChecks` in `release-gate.config.json` so it can never regress silently again.
- ~~**Install a test framework.**~~ ✅ **Done 2026-09-03.** vitest, node environment, no
  jsdom — everything covered so far is a pure function. `npm test` runs it; `Unit &
  Integration` is now a live check in `release-gate.config.json`, so the gate reports
  test counts instead of only "the build compiled". **48 tests over three modules:**
  `lib/qr-token.ts` (pass forgery, tampering, expiry), `lib/zelle/index.ts` (the
  auto-confirm threshold, token forgery, amount tampering) and `utils/format.ts` (money
  rounding, the UTC off-by-one-day trap).

  **Extend it here, in rough order of what would hurt most if wrong:**
  - **Stripe webhooks** — signature verification and idempotency. Untouched so far
    because `lib/stripe/config.ts` throws at import time without `STRIPE_SECRET_KEY`,
    so it needs env stubbing or a small refactor to be reachable from a test.
  - **Role gating** — `lib/auth/helpers.ts` is all Supabase-backed, so it needs a
    client fake. That fake is the piece of infrastructure to build next, and most of
    the remaining untested surface sits behind it.
  - **`lib/zelle/server.ts`** — the confirmation path, also Supabase-backed.
  - Component tests need jsdom + `@testing-library/react` added at that point,
    deliberately, rather than carried now for nothing.

- **Two defects the first tests surfaced.** Neither was fixed in the same change:
  fixing them alters payment business logic, which `CLAUDE.md` rule 2 puts off-limits
  without asking. Both are real; both need a decision.

  1. **`verifyZelleToken` does not expire a token with a malformed `expiresAt`.**
     `lib/zelle/index.ts` compares `new Date(decoded.expiresAt) < new Date()`. If the
     field is not a parseable date the comparison is `NaN < now`, which is `false`, so
     the payload expiry check silently passes and only the 48-hour JWT `exp` still
     caps the token. Pinned as a `KNOWN WEAKNESS` test in `lib/zelle/index.test.ts` so
     the behaviour is visible; that test is the one to invert when it is fixed.
     The token still has to be validly signed, so this is not a forgery route.
  2. **`calculateMembershipFee` would throw if anything called it.**
     `lib/stripe/payments.ts:70` reads `PAYMENT_CONFIG.membershipFees[level]`, but
     `config.ts` deliberately removed `membershipFees` — fees come from Portal
     Settings now. It has **zero callers**, so nothing is broken today, and `tsc`
     already flags it (`TS2339`). Delete it, or reimplement it against
     `getMembershipPricing()`. Leaving it is the option that eventually bites.
- **Add `.github/workflows/ci.yml`.** `/govkit-doctor` reports this as the one missing guardrail.
  govkit deliberately does not scaffold it — a wrong CI workflow is worse than none. It must run the
  same checks as `release-gate.config.json`, and each job must be **named to match that file's
  `ciJob` value** so the gate and CI describe the same thing. The existing `deploy.yml` is a deploy
  workflow, not a checks workflow, and does not satisfy this.
- **Clear the lint backlog** (mostly `@typescript-eslint/no-explicit-any`), then enable `Lint` in
  the release gate.
- **Raise `scripts/source-doc-map.json` severities from `warn` to `gate`**, schema first, as each
  mapped doc catches up.
- ~~Fix `EMAIL_FROM`~~ — **RESOLVED 2026-09-01: it was already correct, and my earlier advice to
  change it was wrong.** DNS shows `portal.hsnef.org` has no A record serving a site but DOES carry
  a `resend._domainkey` TXT record, so it is the verified Resend sending domain. `member.hsnef.org`
  serves the portal but is NOT verified in Resend. **Changing `EMAIL_FROM` to `member.hsnef.org`
  would break email sending.** Leave it. The domain does two different jobs and only one of them
  moved.
- **Separate, real issue: `hsnef.org` publishes THREE `v=spf1` records.** RFC 7208 allows one;
  multiple records make SPF evaluate to permerror, which can hurt deliverability for anything
  sending as `@hsnef.org`. Worth consolidating into a single record.
- **Correct the role-gate docs** so `CLAUDE.md` / `ROUTE_MAP.md` match the code (see DEC-004), or
  change the code deliberately. Right now they disagree and the docs are the wrong one.

### Tier 3 — later

- Add `loading.tsx` / `error.tsx` / `not-found.tsx` per section — there are none anywhere in `app/`.
- Replace the 69 hand-rolled loading spinners. Left deliberately: the loading state should match
  each page's final layout, so they go during that page's redesign, not before.
- Sweep `portal.hsnef.org` out of `docs/` (~26 occurrences presented as current). Risk: someone
  configures a Stripe webhook or OAuth callback against the wrong host.
- `app/admin/settings/page.tsx` has a `roles` field on `settingsCategories` that is never used —
  Office Staff see cards they cannot open. Filter them, or use `PermissionNote`.
- `/admin/settings/appearance` uses a fourth role-gate pattern (inline `useEffect` + `router.push`)
  instead of one of the three sanctioned ones.
- Copy the redesign brief to `design-kit/docs/ORIGINAL_BRIEF.md`. `CLAUDE.md` §3 claims it is there;
  it never was. Rule 3 forbids reading it from OneDrive directly.

## Design-system port — reference

Kit lives in `design-kit/` — **read-only, gitignored, never built, never edited.**
`design-kit/docs/ROUTE_MAP.md` is ~7 months stale; **trust the code** (see DEC-003).

**The pattern, established by `/login`:** open the exemplar in `design-kit/pages/` first (do not work
from memory) → `page.tsx` keeps all logic and maps rows to view models at the boundary → a sibling
presentational component takes plain props → check the "Definition of done" list in `CLAUDE.md` →
one route per commit.

| Route | Exemplar |
|---|---|
| `/member` | `pages/Home.tsx` |
| `/member/pass` | `pages/Membership.tsx` (QR pass half) |
| `/member/profile` | `pages/Profile.tsx` — existing 750-line page, a **rewrite** not a fill-in |
| `/member/payments` | `pages/Payments.tsx` |
| `/member/donate` | `pages/Donate.tsx` — 690 lines, 2× what the kit sized for |
| `/member/renew` | `pages/Membership.tsx` then `pages/Checkout.tsx` |
| `/member/bookings/new` | `pages/BookingWizard.tsx` |
| `/member/bookings`, `/member/requests` | `pages/Requests.tsx` |
| `/member/bookings/[id]` | `pages/admin/AdminMemberDetail.tsx` |
| `/member/events` | `pages/Events.tsx` |
| payment-success routes | `pages/PaymentSuccess.tsx` |

**Do not delete the `/member/family` or `/member/activity` dashboard tiles.** The kit's phase 6 says
to; both are live pages (566 + 372 lines). Restyle them.

**No exemplar — ask before designing:** `/member/events/[id]` and its payment pair,
`/member/requests/[id]/payment` pair, `/member/activity`, `/member/family`.

## Verifying work (read before trusting a green result)

- **Never run `npm run build` while `next dev` is running.** They share `.next/` and the production
  build wipes the dev server's stylesheet, leaving an unstyled page and a 404 on
  `/_next/static/css/app/layout.css`. This cost a debugging cycle. Use `npx tsc --noEmit` while
  developing; build only with the dev server stopped.
- **Type gate:** the count must not go UP. **Do not trust a baseline written in a doc** — three
  files quoted three different numbers and all had rotted, and DEC-008 records a fourth that was
  a mis-measurement in the first place. Measure first:
  `npx tsc --noEmit 2>&1 | grep -cE '^(app|components|lib|utils|types)/'`, then compare your
  change against that. A sudden *drop* is not automatically a win — `tsc` aborts its semantic
  pass on a syntax error, so check for `TS1xxx` codes before celebrating (see DEC-005).
- **`npm run build` proves little about types or lint:** `next.config.ts` sets `ignoreBuildErrors`
  and `ignoreDuringBuilds`.
- **Open a browser.** Both real bugs in session 1 were invisible to build and typecheck.

## Environments

| | URL | Branch | Supabase |
|---|---|---|---|
| Local | http://localhost:3000 | — | `dev-mp` (`bcujsesgrzijyisvmnwm`) |
| Dev | https://dev.member.hsnef.org | `dev` | `dev-mp` (`bcujsesgrzijyisvmnwm`) |
| Production | https://member.hsnef.org | `main` | `prod-mp` (`gapvsdrzavjaublwkqfm`) |

Main site: https://hsnef.org · See `docs/ENVIRONMENT_QUICK_REFERENCE.md` — **that file is
pre-split and still lists the Supabase keys as "Same Across All Environments", which is no
longer true.** It has not been swept yet.

`.env.local` is complete and points at the real dev Supabase. `QR_TOKEN_SECRET` /
`ZELLE_TOKEN_SECRET` / `CRON_SECRET` are locally generated, so QR codes issued by dev will not
verify locally — copy dev's `QR_TOKEN_SECRET` from Vercel if you need that.

## Revision History

| Date | Session | Changes |
|------|---------|---------|
| 2026-09-03 | 6 | vitest installed and the first 48 tests added over the QR pass, the Zelle money path and the shared formatter. `Tests` enabled in the release gate. Two defects recorded above, neither fixed: the Zelle malformed-`expiresAt` hole and the dead `calculateMembershipFee`. |
| 2026-09-03 | 5 | Reconciled against the repo after `docs:sync-check` flagged this file stale. Tier 0 emptied (all three items closed 09-01/09-02). Cloudflare Phase 2 recorded as done — production is live. `userData` bug and stage 8 marked done. Every hardcoded type-error count replaced with the command. Environments table gained the Supabase refs, with a warning that `gapvsdrzavjaublwkqfm` is PRODUCTION. |
| 2026-08-31 | 1 | Roadmap scaffolded by govkit; migrated from `tasks/NEXT_PRIORITIES.md`. |
