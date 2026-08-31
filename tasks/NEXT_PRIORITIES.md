# Next priorities — HSNEF member portal

Living tracker. Point at the command or console that knows; do not copy numbers
that drift. Historical notes live in `docs/status/**` and are NOT instructions.

---

## In flight: design system port

Applying the Magic Patterns design kit (`design-kit/`, gitignored) to the app.
Rules: `CLAUDE.md`. Route reference: `design-kit/docs/ROUTE_MAP.md` — **stale by
~7 months, trust the code over it**.

| Stage | What | Status |
|---|---|---|
| 1 | Tokens — palette, fonts, `hsnef` theme as default | ✅ done |
| 2 | Primitives — `components/{ui,brand,nav,auth}`, `utils/` | ✅ done |
| 3 | Colour sweep — 929 hex → tokens across 83 files | ✅ done |
| 4 | Shell — `PortalShell` replaces `AdminLayout` | ✅ done |
| 5 | Login redesign | todo |
| 6 | Member screens (21 routes) | todo |
| 7 | Admin screens (~40 routes) | todo |
| 8 | Non-React — emails, PDFs, Stripe appearance | todo |

Verification per change: `npm run build` **and** the type-error count must not
rise (see "Type checking" below).

---

## Open questions for Sujit

- **`tailwind-merge`** — the kit's `cn()` needs it (17 components, 44 call
  sites). Without it a caller's `className` override can silently lose to the
  component's own default. `utils/cn.ts` is a plain join with a note. Approve?
- **Login hero photo** — `public/images/temple-hero.{webp,jpg}` is an
  AI-generated placeholder, not the Greenland Road building. Needs a real
  photo before production.
- **Temple opening hours** — not in `lib/constants/temple.ts`. The shell and
  the login design both want them.

---

## Tracking / deferred

- **`EMAIL_FROM` uses a dead domain.** `.env.local` and the deployed envs send
  from `noreply@portal.hsnef.org`, but `portal.hsnef.org` is superseded by
  `member.hsnef.org`. Mail sends only while Resend still has the old domain
  verified. Check the Resend dashboard, then align `EMAIL_FROM` with whichever
  domain is verified — and do it in Vercel for dev + prod, not just locally.
- **`portal.hsnef.org` appears ~26 times across `docs/`** as if it were current.
  Risk: someone configures a Stripe webhook or OAuth callback against the wrong
  host. Worth a documentation sweep.
- **Type checking is not a usable gate yet.** ~469 pre-existing errors, ~400 of
  them one root cause: `types/database.ts` is out of sync with what Supabase
  generates, so every insert/update resolves to `never`. Regenerating that file
  would clear most of them. Until then the gate is "my change adds no new
  errors". Note `next.config.ts` sets `ignoreBuildErrors`, so a green build
  proves nothing about types.
- **No `loading.tsx` / `error.tsx` / `not-found.tsx` anywhere in `app/`.** Add
  per section during stages 6–7.
- **69 hand-rolled loading spinners** left in place deliberately — the loading
  state should match each page's final layout, so they are replaced during that
  page's redesign, not before.
- **`/admin/settings` role gate disagrees with the docs.** Code says any staff;
  `CLAUDE.md` and `ROUTE_MAP.md` say Admin-only. Code is authoritative per
  Magic Patterns' correction — but the docs should be fixed so the next person
  is not misled.
- **`settingsCategories` in `app/admin/settings/page.tsx` has a `roles` field
  that is never used.** Office Staff see cards they cannot open. Should filter,
  or use `PermissionNote`.
- **`/admin/settings/appearance` uses a 4th role-gate pattern** (inline
  `useEffect` + `router.push`) rather than one of the three sanctioned ones.

---

## Known good

- Local dev runs against the real dev Supabase; `.env.local` is complete.
  `QR_TOKEN_SECRET` / `ZELLE_TOKEN_SECRET` / `CRON_SECRET` are locally
  generated, so QR codes issued by dev will not verify locally.
- Environments: local `:3000` · dev `dev.member.hsnef.org` · prod
  `member.hsnef.org`. See `docs/ENVIRONMENT_QUICK_REFERENCE.md`.
