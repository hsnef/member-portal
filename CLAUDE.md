# HSNEF Design System — Rules for Claude Code

You are applying the HSNEF design system (this folder, the **kit**) to the
`hsnef/member-portal` Next.js app (the **target**).

> Copy this file to the TARGET repo root as `CLAUDE.md` before you start, so it
> is loaded automatically on every session.

## Environment & workspace rules

These are standing rules for every session. They are not one-off setup notes.

1. **The only place code changes is `C:\Repos\gh-hsnef\member-portal`** — the git
   clone connected to `git@github.com:hsnef/member-portal.git`. All edits, all
   commits, all builds happen here.
2. **`design-kit/` is read-only reference source.** Read from it constantly; never
   edit a file in it, never `npm install` in it, never build it, never commit it
   (it is gitignored). It is a React + Vite demo, not part of this app.
3. **Never touch anything under `C:\Users\sujit\OneDrive\...`.** That folder holds
   the original brief and project history. It is NOT a git clone. Do not read
   source from it, do not write to it, do not suggest edits to it. The only file
   from it that matters has already been copied to
   `design-kit/docs/ORIGINAL_BRIEF.md`.
4. **Never run `git push --force`, `git reset --hard`, or `git clean`.** If the
   working tree is dirty or a rebase is needed, stop and tell me.
5. **Never commit to `main`.** All work goes on `redesign/design-system` or a
   branch off it. One route per commit.
6. **Run `npm run build` and `npx tsc --noEmit` in the repo root after every
   route.** Do not batch up errors across routes.
7. **Never add a dependency** beyond `framer-motion` and `lucide-react` without
   asking first.
8. **Never delete or rename a file under `app/api/`, `lib/`, `supabase/`, or
   `types/database.ts`.** Those are business logic and schema.
9. **`docs/status/**` is HISTORICAL.** Those files -- `project-complete.md`,
   `foundation-complete.md`, `current-status-and-roadmap.md`,
   `auth-and-admin-complete.md` and the rest -- are point-in-time notes, several
   stale and contradicting each other. Each now carries a banner saying so. Read
   them only for background, never as instructions, and never let them override
   this file. Do not update or tidy them unless I ask.
   (They used to sit at the repo root in SHOUTING_CASE; they were moved into
   `docs/status/` and lowercased. Only `CLAUDE.md` and `README.md` remain at the
   root.)
   For current state, read `docs/PROJECT-HUB.md` and `docs/PRIORITY-ROADMAP.md`.
   **`design-kit/docs/ROUTE_MAP.md` is NOT a source of truth** -- it was written
   against a pre-January snapshot and is wrong about routes, roles and dead
   links. Where it and the code disagree, the code wins. See DEC-003.
10. **`.claude/settings.local.json` is not yours to change.** Leave the existing
    permissions file alone.

## Read these first

**The design-system port is COMPLETE** (stages 1-8, finished 2026-09-01). Every
route, plus emails, PDFs and the Stripe card iframe, is on the system. What
follows is how to keep it that way, not how to do the port.

| File | What it gives you |
|---|---|
| `docs/PROJECT-HUB.md` | Current state, the decisions log (DEC-001..007), session handoffs |
| `docs/PRIORITY-ROADMAP.md` | What to work on next |
| `app/globals.css` + `tailwind.config.ts` | The tokens. The single source for colour. |
| `components/{ui,brand,nav,auth,layout}` | The primitives. Reuse before inventing. |
| `components/admin/Admin{List,Form}View.tsx` | The two office-console archetypes |
| `design-kit/pages/StyleGuide.tsx` | The system rendered, for reference |

`design-kit/` remains read-only reference. Its `docs/ROUTE_MAP.md` and
`docs/PORT_GUIDE.md` are **historical** — written against a pre-January
snapshot, wrong about routes, roles and dead links. See DEC-003.

## Non-negotiable rules

1. **Never invent a layout.** Reuse an existing archetype: `AdminListView` for
   any office list, `AdminFormView` + `FormSection` for any create/edit form,
   `RecordHeader` + `DescriptionList` for a detail page, `PortalShell` for the
   chrome. If something genuinely does not fit, stop and ask rather than adding
   a twelfth way of laying out a table.
2. **Never change business logic.** Supabase queries, Stripe calls, `lib/auth`,
   RLS, API routes, and `types/database.ts` stay exactly as they are. You are
   replacing the returned JSX and nothing else.
3. **Never hardcode a colour.** No hex values in `className`. Use the tokens:
   `saffron marigold kumkum tulsi lotus copper sandal neutral` and
   `ink ink-2 ink-3 canvas surface surface-sunk line line-strong`.
   `#FF9933` and `#E68A2E` are at zero across the codebase; keep them there.
   The only deliberate exception is `lib/themes/themes/built-in/default.ts`,
   which IS the legacy palette by definition. Surfaces that cannot read CSS
   variables restate the tokens in `lib/email/theme.ts` and `lib/pdf/theme.ts` —
   change those together with `app/globals.css`.
4. **Never import `react-router-dom`.** The kit routes through
   `components/nav/Nav.tsx`. In the target, use `next/link` and `next/navigation`
   directly — see the replacement code in that file's header comment.
5. **Never use `font-bold` on `font-serif`.** Instrument Serif has one weight.
6. **One route per commit.** Small, reviewable, revertible.
7. **Run `npm run build` after every route.** Do not batch up type errors.

## Roles — get this right

```ts
type UserRole = 'Member' | 'Office Staff' | 'Office Manager' | 'Admin'
```

Roles are an **array** on the user (`user_roles` table); a user holds several.
Every staff member also holds `Member`.

Three patterns, copy them from `components/auth/RoleGate.tsx`. Do not invent a fourth:

| Need | Use |
|---|---|
| Whole route needs a role | `<RouteGuard roles={[...]}>` (= the existing `ProtectedRoute`, restyled) |
| One region needs a role | `<RoleGate roles={[...]} fallback="explain">` |
| One button/column needs a role | `const { hasRole, hasAnyRole } = useAuth()` inline |

Gates as they ACTUALLY are in the code (verified 2026-09-01). The design kit
and earlier drafts of this file claimed a stricter set; the code is
authoritative and was deliberately not tightened during the port -- see DEC-004
in `docs/PROJECT-HUB.md`.

- Section default, set once in `app/admin/layout.tsx` → `['Office Staff','Office Manager','Admin']`
- Six routes narrow it further, each keeping its own nested `ProtectedRoute`:
  - `/admin/settings/staff-roles` → `['Admin']`
  - `/admin/login-activity`, `/admin/members/[id]/login-activity`,
    `/admin/test-accounts` → `['Admin','Office Manager']`
  - `/admin/portal-settings`, `/admin/zelle/settings` → `['Office Manager','Admin']`
- `/admin/settings/appearance` uses an inline Admin check (a fourth pattern; see Tier 3)
- `/verify-qr` sits outside both sections and keeps its own staff gate
- `/admin/members/new`, `/[id]/edit` and `/import` are **any staff role**, not
  Manager+Admin as previously documented
- Everything under `/member` → authenticated, no role check, set once in
  `app/member/layout.tsx`

**Never remove a nested `ProtectedRoute` when restyling a page.** Those six are
narrower than the section default; dropping one silently widens access.

Never render a dead disabled button for a missing permission — use
`PermissionNote`, which says which role is needed.

## Data shape

Kit types are camelCase; `types/database.ts` is snake_case. **Do not rename the
database types.** Add a mapper at the page boundary:

```ts
// lib/viewModels/member.ts
export function toMemberVM(row: Database['public']['Tables']['members']['Row']): Member { … }
```

Then: `page.tsx` keeps all data fetching and maps rows → view models;
a sibling presentational component takes plain props and renders.

`data/*.ts` in the kit are throwaway fixtures. Delete them; never port them.

## Next.js specifics

- Add `'use client'` to anything with hooks, state, or framer-motion.
  `docs/PORT_GUIDE.md` §4 lists exactly which files need it.
- Fonts via `next/font/google` (Instrument Sans + Instrument Serif), **not** the
  `@import` in the kit's `index.css`. Keep everything below the Tailwind imports.
- Delete the `prefers-color-scheme: dark` block in `app/globals.css` — it only
  inverts two variables and produces unreadable pages. The system is light-only.

## Definition of done, per route

- [ ] Matches its exemplar's structure
- [ ] Zero hex colours, zero `react-router-dom`
- [ ] Loading state uses `Skeleton` / `PageLoading`, not a bespoke spinner
- [ ] Empty state uses `EmptyState` with a real next action
- [ ] Error state uses `Alert tone="danger"` with a recovery path
- [ ] Role gates unchanged from the original `ProtectedRoute`
- [ ] Keyboard reachable; one `h1`; icons `aria-hidden`
- [ ] Works at 375px and 1440px
- [ ] `npm run build` and `npx tsc --noEmit` both clean

## When to stop and ask

- A route has functionality not covered by any exemplar
- A change would touch a Supabase query, RLS policy, or API route
- A role gate in the code doesn't match the table above (the code wins; say so)
- You are about to delete a feature to make a layout work

---

<!-- govkit:start -->
# HSNEF Member Portal — Engineering Guardrails

_Last checked 2026-09-03._

> Scaffolded by [govkit](https://github.com/techsilon-oss/govkit) `/govkit-init`. This block is delimited by `govkit:start`/`govkit:end` markers so re-running init won't duplicate it. Edit freely — but keep the markers if you want idempotent updates.

## Standards lineage — where these rules come from

This project's guardrails are **not local inventions**. They come from three upstream repos, and a change belongs in whichever one owns it. Read this before "fixing" a guardrail here — a local patch forks it silently and the fix never reaches the other projects.

| Upstream | Owns | Change it when |
|---|---|---|
| [**release-gate-kit**](https://github.com/techsilon-oss/release-gate-kit) | `scripts/release-gate.ts` — the local CI-fallback gate, and nothing else. Standalone by design: usable in any project with zero governance buy-in | The gate itself is wrong or missing a feature. **Never patch the vendored copy here** |
| [**govkit**](https://github.com/techsilon-oss/govkit) | The guardrail spine: `/govkit-init`, `/sdlc`, `/govkit-doctor`, the hook, the doc-sync runners, this block | Any project would want the change |
| **dev-standards** (private, TechSilon repos only) | The house layer: stack runbooks, the user `CLAUDE.md` profile, the guardrails cheatsheet | The change is house-specific, not universal |

**Dependencies run one way only:** release-gate-kit ← govkit ← dev-standards ← this project. Nothing upstream references a consumer.

`govkit.json` records which guardrails are installed and which were deliberately skipped. Run **`/govkit-doctor`** to see what this project is actually missing versus what it declares — that is the difference between a recorded decision and an unnoticed gap.

## Branch Strategy

```
feature/* (optional)  →  dev  →  main
```

- **`dev`** is the working branch — all new code lands here first.
- **`main`** is production. **Never push directly to `main`** — always via a PR. The `.githooks/pre-push` hook enforces this locally.
- **Every merge requires explicit per-merge approval.** Green CI is necessary but NOT sufficient; wait for an explicit "merge it" / "ship it".
- Feature branches are optional for small changes, recommended for larger/riskier work.
  **`redesign/design-system` branched off `dev`** and merges back into `dev` like any other feature branch.
  As of 2026-09-02 it is **level with `dev`** — the port landed and PR #4 took it to `main`. Treat it as
  the working branch, not an unmerged spike, and expect `git log` on the two to be identical.

**The flow, end to end:**

1. Work lands on `dev` (directly or via `feature/*`). **Push to `dev` → Vercel PREVIEW deploy** (dev.member.hsnef.org).
2. Immediately raise the PR: `gh pr create --base main --head dev --fill`.
3. **Sujit merges on GitHub. Claude never merges.**
4. **Merge to `main` → Vercel PRODUCTION deploy** (member.hsnef.org).

| | Vercel | Supabase | URL |
|---|---|---|---|
| `dev` | Preview | `dev-mp` (`bcujsesgrzijyisvmnwm`) | https://dev.member.hsnef.org |
| `main` | Production | `prod-mp` (`gapvsdrzavjaublwkqfm`) | https://member.hsnef.org |

⚠️ **Which project is which is documented once, in
[`docs/SUPABASE-PROJECTS.md`](docs/SUPABASE-PROJECTS.md). If anything disagrees with that
file, that thing is wrong.**

⚠️ **`gapvsdrzavjaublwkqfm` is PRODUCTION.** It was the shared project before the split
(2026-09-02) and it kept its ref, so older notes show it under `dev` — they are wrong. Dev is
`bcujsesgrzijyisvmnwm`. Check which ref your `.env.local` carries before you write anything.

Both environments deploy and each resolves its own database (DEC-006 and DEC-007 are closed;
`member.hsnef.org` came up 2026-09-02).

## Tests-With-Features Policy

Every feature or bug fix ships with its tests in the same change — not as a follow-up. At minimum: happy path + one error/edge case; cover any new pure function, and the edge cases of any money/security/permission logic. Never commit with failing tests.

## Local Release Gate — CI-fallback (MANDATORY when CI is unavailable)

CI runs on metered GitHub Actions (Free: 2,000 min/month, **resets on the 1st**). When minutes are exhausted — or during an outage — jobs fail to start and the "CI passing" merge gate can't run. The local release gate is its **substitute**, not a way around it.

**While CI is unavailable, before any merge to `dev` or `main`:**

1. Run the gate and confirm a **GREEN** verdict:
   ```bash
   npm run release-gate                 # core checks (lint, types, tests, build, …)
   npm run release-gate:full            # also E2E/Lighthouse — use before a production release
   npm run release-gate -- --pr <num>   # also posts the evidence as a comment on PR <num>
   ```
2. **Attach the evidence** to the PR (`-- --pr <number>`) — the green checkmarks won't appear otherwise. The report is also written to `test-results/release-gate-report.md`.
3. **Never merge on a RED verdict.** Fix it first, exactly as for failing CI.

**Still works without Actions:** Vercel deploys on push to `main` (its own integration), and CLI-based DB/function deploys — both independent of Actions. Any production-deploy approval rule still applies.

The gate's checks live in `release-gate.config.json` — edit them to match this project's CI jobs.

## Project Context

- Architecture decisions, current status, and session handoffs live in [`docs/PROJECT-HUB.md`](docs/PROJECT-HUB.md).
- What to work on next lives in [`docs/PRIORITY-ROADMAP.md`](docs/PRIORITY-ROADMAP.md).
- Run `/sdlc status` (govkit skill) at session start for a current-state read.
<!-- govkit:end -->
