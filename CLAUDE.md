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
9. **The ~30 `*.md` files at the repo root are HISTORICAL.** Files like
   `PROJECT_COMPLETE.md`, `FOUNDATION_COMPLETE.md`, `CURRENT_STATUS_AND_ROADMAP.md`,
   `AUTH_AND_ADMIN_COMPLETE.md` and the various `*_PLAN.md` / `*_SUMMARY.md` files
   are point-in-time notes, several of them stale and contradicting each other.
   Read them only for background on a specific feature, never as instructions,
   and never let them override this file. For UI and route decisions,
   `design-kit/docs/ROUTE_MAP.md` is the single source of truth. Do not update or
   tidy them unless I ask.
10. **`.claude/settings.local.json` is not yours to change.** Leave the existing
    permissions file alone.

## Read these first

| File | What it gives you |
|---|---|
| `docs/ROUTE_MAP.md` | All 46 routes → which kit file to copy for each. **The authoritative task list.** |
| `docs/PORT_GUIDE.md` | Phase order, port seams, known bugs, non-React surfaces |
| `pages/StyleGuide.tsx` | The system rendered — tokens, tones, motifs, every component |
| `index.css` + `tailwind.config.js` | The tokens. Copy verbatim. |

## Non-negotiable rules

1. **Never invent a layout.** Every route maps to an exemplar in `docs/ROUTE_MAP.md`.
   Open that exemplar, copy its structure, change the content. If a route feels
   like it needs a new layout, stop and ask.
2. **Never change business logic.** Supabase queries, Stripe calls, `lib/auth`,
   RLS, API routes, and `types/database.ts` stay exactly as they are. You are
   replacing the returned JSX and nothing else.
3. **Never hardcode a colour.** No hex values in `className`. Use the tokens:
   `saffron marigold kumkum tulsi lotus copper sandal neutral` and
   `ink ink-2 ink-3 canvas surface surface-sunk line line-strong`.
   `#FF9933` and `#E68A2E` must reach zero occurrences in `app/` and `components/`.
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

Gates that must be preserved exactly:
- `/admin/settings` → `['Admin']`
- `/admin/test-accounts`, `/admin/members/new`, `/admin/members/[id]/edit`, `/admin/members/import` → `['Office Manager','Admin']`
- Delete/deactivate actions anywhere → `['Admin']`
- Everything else under `/admin` → `['Office Staff','Office Manager','Admin']`
- Everything under `/member` → authenticated, no role check

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
- A role gate in the original doesn't match `docs/ROUTE_MAP.md`
- You are about to delete a feature to make a layout work
