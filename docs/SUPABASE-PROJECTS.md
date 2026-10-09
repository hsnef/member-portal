# Which Supabase project is which

**This page is the source of truth for Supabase project references.** If any other
file disagrees with it, that file is wrong — fix it, and say so.

---

## The two projects

| | Project name | Reference | URL |
|---|---|---|---|
| **Local + Dev** | `dev-mp` | **`bcujsesgrzijyisvmnwm`** | `https://bcujsesgrzijyisvmnwm.supabase.co` |
| **Production** | `prod-mp` | **`gapvsdrzavjaublwkqfm`** | `https://gapvsdrzavjaublwkqfm.supabase.co` |

Local development uses the **dev** project. There is no separate local database.

---

## ⚠️ The mistake everyone makes

### `gapvsdrzavjaublwkqfm` is PRODUCTION. It holds real member data.

It is easy to get wrong for one specific reason:

**Until 2026-09-02 there was only ONE Supabase project, and every environment used it.**
When dev and production were split, a **new** project was created to be dev, and the
existing one stayed as production. The existing one kept its reference.

So `gapvsdrzavjaublwkqfm` was, correctly, called "the dev project" in everything written
before 2026-09-02 — because back then it was dev *and* production *and* local. Those
older notes are not lying; they are just from before the split.

**Anything you read that calls `gapvsdrzavjaublwkqfm` "dev" predates 2026-09-02 and is
now wrong.** The reference did not move. The meaning did.

This is recorded as **DEC-006** in [`PROJECT-HUB.md`](PROJECT-HUB.md).

---

## What goes wrong if you get it backwards

You point local development at production and start testing. Every member you create,
edit, or delete is a **real temple member**. Every booking, payment and email is real.
RLS does not save you — `SUPABASE_SERVICE_ROLE_KEY` bypasses every policy, and local
development uses it.

There is no undo, and no separate backup of the member table.

---

## How to check what you are actually pointed at

```bash
grep NEXT_PUBLIC_SUPABASE_URL .env.local
```

- Contains `bcujsesgrzijyisvmnwm` → **dev**. Correct for local work.
- Contains `gapvsdrzavjaublwkqfm` → **production**. Stop and fix it before running anything.

### Checking a deployed environment

Read it from what the site actually serves, not from a dashboard setting — the two can
disagree. The reference is in a JavaScript chunk, not the page HTML, so this follows the
chunks:

```bash
check() {
  host="$1"
  curl -s "https://$host/login" \
    | grep -oE '/_next/static/chunks/[^"]+\.js' | sort -u \
    | while read -r f; do curl -s "https://$host$f"; done \
    | grep -oE '[a-z]{20}\.supabase\.co' | head -1
}

check dev.member.hsnef.org   # expect bcujsesgrzijyisvmnwm.supabase.co
check member.hsnef.org       # expect gapvsdrzavjaublwkqfm.supabase.co
```

Verified 2026-09-04: both return the expected project.

---

## Onboarding a new developer

Grant them access to **`dev-mp` (`bcujsesgrzijyisvmnwm`)** only.

There is no reason for a developer to hold production credentials for day-to-day work.
Production access is a separate, deliberate grant.

---

## Where the values live

| Environment | Set in |
|---|---|
| Local | `.env.local` on your own machine, copied from [`.env.local.example`](../.env.local.example) |
| Dev | Vercel project `member` → Preview environment variables |
| Production | Vercel project `member` → Production environment variables |

`.env.local` is gitignored and must stay that way. Never commit a key.

---

## Related

- [`.env.local.example`](../.env.local.example) — every variable the code reads
- [`PROJECT-HUB.md`](PROJECT-HUB.md) — DEC-006 records the split
- [`ENVIRONMENT_QUICK_REFERENCE.md`](ENVIRONMENT_QUICK_REFERENCE.md) — which value goes where
- [`ONBOARDING.md`](ONBOARDING.md) — what to grant a new developer

_Verified against the running sites 2026-09-04._
