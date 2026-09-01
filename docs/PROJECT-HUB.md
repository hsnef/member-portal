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

**Target:** create `hsnef-member-portal-prod`, point Vercel Production at it, leave
`gapvsdrzavjaublwkqfm` as dev/preview only. This is not just an env-var swap — it needs the schema
and migrations applied, auth users migrated, RLS policies verified, Stripe webhook endpoints
re-pointed, and Supabase redirect/OAuth URLs updated per project. Plan it as its own task with a
rollback, and do the cutover when nobody is using the portal.

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

**Preferred fix: Vercel Pro** (~$20/mo) — repo stays private, per-PR previews work, licensing clean.
If the repo is ever made public for another reason, purge those two CSVs from history **first**
(`git filter-repo`, then force-push and rotate nothing — no secrets were exposed). That is a history
rewrite and needs Sujit's explicit go-ahead.

## Session Handoff

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
