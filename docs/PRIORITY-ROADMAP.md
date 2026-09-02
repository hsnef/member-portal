# HSNEF Member Portal — Priority Roadmap

> What to work on next, and why. Start each session by reading this + `gh issue list`. This file captures the WHY and ORDER; GitHub Issues capture the WHAT and STATUS.

## START HERE — the active runbook

**[`docs/RUNBOOK-infra-consolidation.md`](RUNBOOK-infra-consolidation.md)** is a
step-by-step walk-through of the current infrastructure work: consolidating the two
Vercel projects into one, fixing `member.hsnef.org` (which is DOWN — Cloudflare
redirect loop, not reaching Vercel at all), applying the events migration, splitting
Supabase, and finally merging PR #3. It carries its own progress checkboxes, so if a
session ended mid-way, the ticks say where.

Everything in Tier 0 below is either covered by that runbook or superseded by it.
Where the two disagree, the runbook is newer.

## Current Priority Tiers (as of 2026-08-31)

### Tier 0 — blocking, do before more feature work

- ~~**Restore deployment (DEC-007).**~~ **RESOLVED 2026-09-01** — the repo was made
  public, Vercel builds again, and `dev.member.hsnef.org` is live on the design system.
  The repo is staying public for now, which keeps the PII history readable (DEC-010).
  The remaining deployment work is Vercel project consolidation — see the runbook above.
  Superseded text follows:
- **Restore deployment (DEC-007). Nothing has deployed since January** — the Actions workflow is
  disabled and Vercel's Git integration is blocked for private org repos on Hobby. Moving the
  projects to the existing Techsilon Pro team is **ruled out**. Remaining: buy Pro on the owning
  account (permission pending — ask about the nonprofit discount), or investigate re-enabling
  `deploy.yml` to deploy via the Vercel CLI with a token, which sidesteps the Git-integration
  restriction but may not sidestep Hobby's non-commercial licensing. **Do not fix this by making the
  repo public** — see the PII item below.
- **Split the Supabase projects (DEC-006).** All three environments share one live database today,
  so dev testing writes to real member data. **Make the NEW project `dev`, not prod** — that reaches
  the same goal without migrating a single real member row or auth user, and leaves production
  untouched. Renumber the two duplicate migration prefixes first or the fresh `db push` will fail.
- **Remove the member-data CSVs regardless.** `docs/reference/data/current-member-data-import-template*.csv`
  should not be in the repo at all, private or not. Delete from HEAD now; purge from history if/when
  the repo's visibility changes.

### Tier 1 — now

- **Fix the `userData` bug in the two remaining admin files.** `useAuth()` has no
  `userData`, so `userData?.user?.id` is always undefined:
  `app/admin/bookings/new/page.tsx` and `app/admin/bookings/[id]/page.tsx`. Beyond the
  failed member lookup, it feeds `reviewed_by` — **the record of who approved or
  rejected a booking is being written as null.** Fix alongside those routes in stage 7.
  (`app/admin/members/import` also has a `userData` but it is a local from a real
  `supabase.auth.getUser()` call — that one is fine.)
- ~~**Design-system port, stage 6: member screens (21 routes).**~~ ✅ **Done.**
  Previous plan, kept for reference:
  Order: `/member` → `/member/pass` → `/member/profile` → `/member/payments` → `/member/donate` →
  `/member/renew` → `/member/bookings/new` → `/member/bookings` + `/member/requests` →
  `/member/bookings/[id]` → the payment/success routes → `/member/events`.
  One route per commit. Exemplar map below.
- ~~**Stage 7** (admin, 40 routes)~~ ✅ **Done.**
- **Stage 8** — the non-React surfaces: `lib/email/templates.ts`, `lib/email/templates/payment.ts`,
  `lib/email/mailer.ts`, the inline HTML in `app/api/bookings/send-notification`, and
  `lib/pdf/{receipt,invoice}.ts`.
- **Then: review everything under `docs/` for alignment (agreed with Sujit 2026-09-01).**
  Any design element, colour, route, screenshot or component name referenced in documentation
  must match what the code now does. Known drift to fix: `#FF9933` in `lib/constants/temple.ts`
  and the testing guides, the ~26 `portal.hsnef.org` references, the role-gate tables that
  disagree with the code (DEC-004), and `CLAUDE.md` rule 9 naming root `*.md` files that were
  moved into `docs/`.

**Blocked on Sujit:**
- `tailwind-merge` dependency approval. The kit's `cn()` needs it (17 components, 44 call sites);
  without it a caller's `className` override can silently lose to the component's own default.
  `utils/cn.ts` is a plain join with a note explaining the one-line swap.
- **Real temple opening hours** — not in `lib/constants/temple.ts`. The login hero and the shell's
  office card both want them and currently show the office phone instead. Inventing hours on a
  sign-in page was not acceptable.
- **A real photo of the temple.** `public/images/temple-hero.{webp,jpg}` is AI-generated, not the
  Greenland Road building. Members will recognise that. **Replace before production.**
- Next.js dev overlay reported "1 Issue" on `/login`; not yet diagnosed.

### Tier 2 — next (high-value, start-ready)

- **Regenerate `types/database.ts` from Supabase. AGREED with Sujit 2026-09-01: do this at the
  END of the design-system port, before anything else.** ~400 of the type errors trace to this one
  stale file — every insert/update resolves to `never` — and that noise is what makes the other ~50
  unreadable.

  This is not cleanup. **The type checker has been reporting live defects all along and nothing was
  reading its output.** Five bugs found during stage 6-7 were each visible to it:
  the `userData` misreads (empty bookings list, `member_id: null` on new bookings,
  `reviewed_by: null` on approvals), the `address_line1` typo (receipts issued with no address), and
  `const memberId = memberId` (two admin pages that threw ReferenceError and had never rendered).
  `next.config.ts` sets `ignoreBuildErrors`, so the build surfaced none of them.

  Doing it will surface more. Treat that as the point, not a setback. Afterwards, move `Type check`
  out of `_disabledChecks` in `release-gate.config.json` so it can never regress silently again.
- **Install a test framework.** There is none, and no test files. `CLAUDE.md`'s tests-with-features
  policy cannot be honoured until this exists. Start with the money/permission paths: Stripe
  webhooks, Zelle confirmation, role gating.
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
- **Type gate:** must not report MORE than the **469** baseline in `app|components|lib|utils|types`.
  A sudden *drop* means something failed to parse — `tsc` aborts its semantic pass on a syntax error.
- **`npm run build` proves little about types or lint:** `next.config.ts` sets `ignoreBuildErrors`
  and `ignoreDuringBuilds`.
- **Open a browser.** Both real bugs in session 1 were invisible to build and typecheck.

## Environments

| | URL | Branch |
|---|---|---|
| Local | http://localhost:3000 | — |
| Dev | https://dev.member.hsnef.org | `dev` |
| Production | https://member.hsnef.org | `main` |

Main site: https://hsnef.org · See `docs/ENVIRONMENT_QUICK_REFERENCE.md`.
`.env.local` is complete and points at the real dev Supabase. `QR_TOKEN_SECRET` /
`ZELLE_TOKEN_SECRET` / `CRON_SECRET` are locally generated, so QR codes issued by dev will not
verify locally — copy dev's `QR_TOKEN_SECRET` from Vercel if you need that.

## Revision History

| Date | Session | Changes |
|------|---------|---------|
| 2026-08-31 | 1 | Roadmap scaffolded by govkit; migrated from `tasks/NEXT_PRIORITIES.md`. |
