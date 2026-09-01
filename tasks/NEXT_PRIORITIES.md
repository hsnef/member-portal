# Next priorities — HSNEF member portal

Living tracker. Point at the command or console that knows; do not copy numbers
that drift. Historical notes live in `docs/status/**` and are NOT instructions.

**Last worked:** 2026-08-31 · branch `redesign/design-system` (branched from
`1df4acd` on `main`).

---

## Where we are

Applying the Magic Patterns design kit to the app. The kit lives in
`design-kit/` — **read-only, gitignored, never built, never edited.**

Rules: root `CLAUDE.md`. Kit docs: `design-kit/docs/{ROUTE_MAP,PORT_GUIDE}.md`.

> **`ROUTE_MAP.md` is ~7 months stale. Trust the code over it.** It was written
> against a pre-January snapshot: it lists 46 routes (the app has 71), calls
> `/member/profile`, `/member/family` and `/member/activity` dead links (they are
> live pages), points at `/admin/purohits` (moved to `/admin/settings/priests`),
> and knows nothing of Zelle, themes, the join/register funnel, audit logs or
> event registration. Magic Patterns has confirmed: **the code is authoritative.**

### Stage status

| Stage | What | Status |
|---|---|---|
| 1 | Tokens — palette, fonts, `hsnef` theme as default | ✅ |
| 2 | Primitives — `components/{ui,brand,nav,auth}`, `utils/` | ✅ |
| 3 | Colour sweep — 929 hex → tokens across 83 files | ✅ |
| 4 | Shell — `PortalShell` replaces `AdminLayout` | ✅ |
| 5 | Login redesign | ✅ |
| **6** | **Member screens (21 routes) — START HERE** | ⬜ |
| 7 | Admin screens (~40 routes) | ⬜ |
| 8 | Non-React — emails, PDFs, Stripe appearance | ⬜ |

### What a user sees today

- ✅ New palette, Instrument Sans/Serif — **everywhere**
- ✅ New navigation shell (sidebar, top bar, footer) — everywhere under
  `/member` and `/admin`. The member section previously had **no nav at all.**
- ✅ `/login` fully redesigned
- ❌ **~70 page interiors are still the old layouts** — grey cards, hand-rolled
  tables, old spacing, bespoke spinners. This is stages 6–7 and is the bulk of
  the remaining work.

---

## Next session: start Stage 6

Order (from `PORT_GUIDE.md` §9, adjusted for routes that actually exist):

`/member` → `/member/pass` → `/member/profile` → `/member/payments` →
`/member/donate` → `/member/renew` → `/member/bookings/new` →
`/member/bookings` + `/member/requests` → `/member/bookings/[id]` →
the payment/success routes → `/member/events`

**The pattern, established by `/login` — follow it exactly:**

1. Open the exemplar in `design-kit/pages/` first. Do not work from memory.
2. `page.tsx` keeps **all** logic — Supabase queries, Stripe calls, mutations,
   error handling — and maps rows to view models at the boundary.
3. A sibling presentational component takes plain props and renders. See
   `app/login/page.tsx` + `components/auth/LoginView.tsx`.
4. Check the "Definition of done" list in `CLAUDE.md`.
5. One route per commit.

Exemplar map for member routes:

| Route | Exemplar |
|---|---|
| `/member` | `pages/Home.tsx` |
| `/member/pass` | `pages/Membership.tsx` (QR pass half) |
| `/member/profile` | `pages/Profile.tsx` — **existing 750-line page, this is a rewrite not a fill-in** |
| `/member/payments` | `pages/Payments.tsx` |
| `/member/donate` | `pages/Donate.tsx` — **690 lines, 2× what the kit sized for** |
| `/member/renew` | `pages/Membership.tsx` then `pages/Checkout.tsx` |
| `/member/bookings/new` | `pages/BookingWizard.tsx` |
| `/member/bookings`, `/member/requests` | `pages/Requests.tsx` |
| `/member/bookings/[id]` | `pages/admin/AdminMemberDetail.tsx` |
| `/member/events` | `pages/Events.tsx` |
| payment-success routes | `pages/PaymentSuccess.tsx` |

**Do NOT delete the `/member/family` or `/member/activity` dashboard tiles.**
The kit's Phase 6 says to; both are live pages (566 + 372 lines). Restyle them.

Routes with **no exemplar** — ask before designing: `/member/events/[id]` and
its payment pair, `/member/requests/[id]/payment` pair, `/member/activity`,
`/member/family`.

---

## How to verify (read this before trusting a green result)

**Never run `npm run build` while `next dev` is running.** They share `.next/`
and the production build wipes the dev server's stylesheet, leaving the browser
with an unstyled page and a 404 on `/_next/static/css/app/layout.css`. This
already cost a debugging cycle. Use `npx tsc --noEmit` while developing; build
only with the dev server stopped.

- **Type gate:** `npx tsc --noEmit` must not report MORE errors than baseline.
  Baseline is **469** in `app|components|lib|utils|types`. It is not zero and
  cannot be — see "Deferred" below. Note tsc aborts the semantic pass on a
  syntax error, so a sudden *drop* means something failed to parse, not that
  you fixed 400 things.
- **Build:** `npm run build` — but `next.config.ts` sets `ignoreBuildErrors`
  and `ignoreDuringBuilds`, so a green build proves nothing about types or lint.
- **Look at it in a browser.** Both real bugs this session (the 404 stylesheet,
  the dead opacity classes) were invisible to build and typecheck and obvious
  on screen.

Start the dev server: `npm run dev` → http://localhost:3000

---

## Open questions for Sujit

- **`tailwind-merge`** — the kit's `cn()` needs it (17 components, 44 call
  sites). Without it a caller's `className` override can silently lose to the
  component's own default. `utils/cn.ts` is a plain join with a note explaining
  the one-line swap. Approve the dependency?
- **Temple opening hours** — not in `lib/constants/temple.ts`. The login hero
  and the shell's office card both want them; both currently show the office
  phone instead. Inventing hours on a sign-in page was not acceptable.
- **Login hero photo** — `public/images/temple-hero.{webp,jpg}` is an
  AI-generated placeholder, not the Greenland Road building. Members will know.
  Replace before production.
- **Next.js dev overlay showed "1 Issue"** on `/login`. Not yet diagnosed —
  open the overlay and read it.

**Resolved:** support address is `office@hsnef.org` (was `info@` on the old
login page). Now sourced from `lib/constants/temple.ts`.

---

## Tracking / deferred

- **`EMAIL_FROM` uses a dead domain.** Sends from `noreply@portal.hsnef.org`,
  but `portal.hsnef.org` is superseded by `member.hsnef.org`. Mail sends only
  while Resend still has the old domain verified. Check the Resend dashboard,
  then align `EMAIL_FROM` — in Vercel for dev **and** prod, not just locally.
- **`portal.hsnef.org` appears ~26 times across `docs/`** as if current. Risk:
  someone configures a Stripe webhook or OAuth callback against the wrong host.
- **Type checking is not a real gate.** ~469 pre-existing errors, ~400 one root
  cause: `types/database.ts` is out of sync with what Supabase generates, so
  every insert/update resolves to `never`. Regenerating that file would clear
  most of them and make the gate meaningful. Its own job, not part of the port.
- **No `loading.tsx` / `error.tsx` / `not-found.tsx` anywhere in `app/`.** Add
  per section during stages 6–7.
- **69 hand-rolled loading spinners** left deliberately. The loading state
  should match each page's final layout, so they get replaced during that
  page's redesign, not before.
- **`/admin/settings` role gate disagrees with the docs.** Code says any staff;
  `CLAUDE.md` and `ROUTE_MAP.md` say Admin-only. Code wins, but the docs should
  be corrected so the next person is not misled.
- **`settingsCategories` in `app/admin/settings/page.tsx` has a `roles` field
  that is never used.** Office Staff see cards they cannot open. Should filter,
  or use `PermissionNote`.
- **`/admin/settings/appearance` uses a 4th role-gate pattern** (inline
  `useEffect` + `router.push`) instead of one of the three sanctioned ones.
- **`design-kit/docs/ORIGINAL_BRIEF.md` was never copied in.** `CLAUDE.md` §3
  claims it exists. If the brief has priorities or board commitments, copy it
  from OneDrive (rule 3 forbids reading it there directly).

---

## Decisions made this session — do not relitigate

- **Theme system and design system BOTH stay live.** `app/globals.css` carries
  both token families. The seven overlapping tokens (`--canvas`, `--surface`,
  `--ink`, `--ink-2`, `--saffron`, `--kumkum`, `--line`) are aliased to their
  `--theme-*` counterpart, so runtime theming still moves the design system and
  un-ported pages picked up the new palette for free. `hsnef` is registered as
  a built-in theme and is the default via `DEFAULT_THEME_NAME`; Settings →
  Appearance still works and `default` / `florida-oura` remain selectable.
- **Colour token opacity uses `color-mix()`.** Tailwind 3 cannot compose alpha
  onto a bare `var()`. Hardcoding channel triplets would fix alpha but break
  runtime theming. Only colours use the `token()` helper in
  `tailwind.config.ts`; fonts, radii, shadows and spacing stay plain `var()`.
- **Role gates were NOT tightened.** The section layouts carry the loosest gate
  for their section; the 6 routes needing more keep their own nested
  `ProtectedRoute` (`login-activity` ×2, `portal-settings`, `staff-roles`,
  `test-accounts`, `zelle/settings`). `/verify-qr` is outside both sections.
  Nobody gained access they did not have.
- **Unwrapping JSX wrappers: swap for fragments, never delete the tags.**
  Deleting them breaks any return with multiple top-level siblings.

---

## Known good

- `.env.local` is complete and points at the **real dev Supabase** (verified
  HTTP 200 against `portal_settings`). Stripe test keys, Resend key present.
  `QR_TOKEN_SECRET` / `ZELLE_TOKEN_SECRET` / `CRON_SECRET` are locally
  generated, so QR codes issued by dev will not verify locally — copy dev's
  `QR_TOKEN_SECRET` from Vercel if you need that.
- Environments: local `:3000` · dev `dev.member.hsnef.org` · prod
  `member.hsnef.org` · main site `hsnef.org`. See
  `docs/ENVIRONMENT_QUICK_REFERENCE.md`.
- `npm install` has been run; `framer-motion` and `lucide-react` added.
