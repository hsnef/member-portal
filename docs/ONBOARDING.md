# Onboarding a new developer

What a new person needs to work on this portal, and how to give it to them
safely. **No secret values appear in this file, and none should ever be added
to it** — see the warning at the bottom.

## 1. Access to grant

Each of these is an invitation you send from a dashboard. None involves sending
anyone a password.

| System | What to do | Where |
|---|---|---|
| **GitHub** | Invite to the `hsnef` org, write access to `member-portal` | Org → People → Invite |
| **Supabase** | Invite to the org holding `hsnef-member-portal-dev` (`gapvsdrzavjaublwkqfm`) | Project → Settings → Team |
| **Vercel** | Invite to the `hsnef` team so they can read build logs | Team → Settings → Members |
| **Stripe** | Invite as a team member, **test mode only** to start | Settings → Team |
| **Resend** | Only if they will touch transactional email | Settings → Team |

Prefer an invitation to a shared login every time. An invitation can be revoked
for one person; a shared password has to be rotated for everybody.

## 2. Local setup

```bash
git clone git@github.com:hsnef/member-portal.git
cd member-portal
npm install
git config core.hooksPath .githooks   # activates the pre-push guard
npm run dev                            # http://localhost:3000
```

Then read, in this order:

1. [`CLAUDE.md`](../CLAUDE.md) — the rules for this repo. Not optional.
2. [`docs/PROJECT-HUB.md`](PROJECT-HUB.md) — current state and the decisions log
   (DEC-001 … DEC-011). **Read DEC-009 before touching events.**
3. [`docs/ROLES-GUIDE.md`](ROLES-GUIDE.md) — what each role can do
4. [`docs/ACCESS-AND-ROLES.md`](ACCESS-AND-ROLES.md) — how access works mechanically

## 3. The `.env.local` file

The app will not start without it. It is gitignored and **must stay that way**.

These are the variable **names** it needs. The values come from the dashboards
above — Supabase → Settings → API, Stripe → Developers → API keys, Resend →
API Keys:

```
NEXT_PUBLIC_SUPABASE_URL            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY       STRIPE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY           STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL                 RESEND_API_KEY
EMAIL_FROM                          CRON_SECRET
EMAIL_FROM_NAME                     QR_TOKEN_SECRET
EMAIL_REPLY_TO                      ZELLE_TOKEN_SECRET
```

**How to hand these over.** Use a password manager's secure-share feature
(1Password, Bitwarden) or an expiring one-time link. **Not** email, **not** chat,
**not** a file in this repo. Two of these deserve particular care:

- `SUPABASE_SERVICE_ROLE_KEY` **bypasses every RLS policy.** Anyone holding it
  can read and write every member record, ignoring all access rules. Treat it
  like the database password.
- `STRIPE_SECRET_KEY` moves real money if it is a live key. Give a new developer
  **test-mode keys** until they need otherwise.

Better still, let them generate their own where possible: Supabase and Stripe
both issue per-user keys, so nothing needs to be copied between people.

## 4. How work ships

```
feature/*  ->  dev  ->  PR  ->  main
                                 ^ Sujit merges. Nobody else, ever.
```

- Never push to `main`. `.githooks/pre-push` blocks it — that is why step 2 sets
  `core.hooksPath`.
- Conventional commits: `type(scope): description`.
- Never commit failing tests or a red build.
- `npm run build` and `npx tsc --noEmit` before every commit.

## 5. Before their first commit — two live hazards

**The type checker is not enforced.** `next.config.ts` sets `ignoreBuildErrors`
and `ignoreDuringBuilds`, so a green build proves nothing about types. Nine real
bugs hid behind that, including bookings saved against a null member and receipts
issued with no address. **Run `npx tsc --noEmit` and read it**, even though it is
not clean — the goal is not to add to the pile.

**The events feature does not work.** Its pages query columns the database does
not have, so every query returns 400 and the pages render "no events yet". A
migration to fix it is committed but **not yet applied**. See DEC-009.

---

> ## Never put secrets in this repository
>
> **The GitHub repo is currently PUBLIC**, so anything committed is world
> readable the moment it is pushed — and stays readable in git history even
> after it is deleted.
>
> This has already happened once here: member households, including children's
> names and home addresses, were committed and served without authentication.
> See DEC-010. The data is out of the working tree now, but it is still in the
> history.
>
> If a key is ever committed, treat it as compromised: **rotate it**, do not
> merely delete the file.
