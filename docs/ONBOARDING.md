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
| **Supabase** | Invite to the org, and give them **`dev-mp` (`bcujsesgrzijyisvmnwm`)**. ⚠️ **Not `gapvsdrzavjaublwkqfm` — that is PRODUCTION**, and it reads as "dev" in anything written before the 2026-09-02 split (DEC-006) | Project → Settings → Team |
| **Vercel** | Invite to the `hsnef` team so they can read build logs | Team → Settings → Members |
| **Stripe** | Invite as a team member, **test mode only** to start | Settings → Team |
| **Resend** | Only if they will touch transactional email | Settings → Team |

Prefer an invitation to a shared login every time. An invitation can be revoked
for one person; a shared password has to be rotated for everybody.

## 2. Local setup

```bash
git clone git@github.com:hsnef/member-portal.git
cd member-portal
npm install                  # also sets core.hooksPath and generates the version stamp
cp .env.local.example .env.local   # then fill it in - see section 3
npm run dev                  # http://localhost:3000
npm test                     # vitest; should be green before you change anything
```

`npm install` runs `prepare`, which activates the `.githooks` pre-push guard and
creates `lib/constants/version.generated.ts`. That file is gitignored and
generated; if you ever see `TS2307` on `./version.generated`, run
`npm run generate-version`.

Then read, in this order:

1. [`CLAUDE.md`](../CLAUDE.md) — the rules for this repo. Not optional.
2. [`docs/PROJECT-HUB.md`](PROJECT-HUB.md) — current state and the decisions log
   (DEC-001 … DEC-011). **Read DEC-009 before touching events.**
3. [`docs/ROLES-GUIDE.md`](ROLES-GUIDE.md) — what each role can do
4. [`docs/ACCESS-AND-ROLES.md`](ACCESS-AND-ROLES.md) — how access works mechanically

## 3. The `.env.local` file

The app will not start without it. It is gitignored and **must stay that way**.

**[`.env.local.example`](../.env.local.example) is the canonical list** — copy it
and fill it in. It names every variable the code actually reads, says which are
required, and explains what breaks when each is missing. Do not work from a list
copied into a doc; this one drifted before.

Values come from the dashboards above — Supabase → Settings → API, Stripe →
Developers → API keys, Resend → API Keys.

Two of its warnings matter more than the rest, and both are easy to get backwards:

- **Point Supabase at `dev-mp` (`bcujsesgrzijyisvmnwm`).** `gapvsdrzavjaublwkqfm`
  is production.
- **Leave `EMAIL_FROM` on `portal.hsnef.org`.** It looks stale next to
  `member.hsnef.org` and it is not — it is the verified Resend sending domain.

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
- `npm test`, `npm run build` and `npx tsc --noEmit` before every commit.
- `npm run release-gate` runs Build + Tests together and writes the evidence
  report the PR flow expects.

## 5. Before their first commit — the one live hazard

**The type checker is not enforced.** `next.config.ts` sets `ignoreBuildErrors`
and `ignoreDuringBuilds`, so a green build proves nothing about types. Nine real
bugs hid behind that, including bookings saved against a null member and receipts
issued with no address. **Run `npx tsc --noEmit` and read it**, even though it is
not clean — the goal is not to add to the pile. Measure the current count
yourself rather than trusting a number in any doc; several had rotted:

```bash
npx tsc --noEmit 2>&1 | grep -cE '^(app|components|lib|utils|types)/'
```

*(A second hazard used to be listed here: that the events feature was broken
because its migration was unapplied. That was resolved on 2026-09-02 — the
migration is applied to both databases and events works. See DEC-009.)*

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
