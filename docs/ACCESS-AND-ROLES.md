# Access & Roles

Who can sign in, what each role unlocks, and how to get back in when you have
forgotten. **There are no passwords to remember** — see below.

> The role *model* is documented here because it changes rarely. **Who holds a
> role is not written down here**, because it changes whenever someone is
> granted one and a hand-maintained list would go stale silently. Read it from
> the database instead:
>
> ```bash
> node scripts/list-access.mjs              # live accounts, roles, memberships
> node scripts/list-access.mjs --markdown   # same, as a table to paste
> ```

## Signing in

Use **"Email me a sign-in link"** on `/login`. No password exists for these
accounts and none is needed — the link signs you straight in. Check the junk
folder: the link is sent by Supabase's built-in mailer, not from `hsnef.org`,
so it fails SPF/DKIM alignment for our domain and lands in spam. Moving auth
email onto Resend (custom SMTP in the Supabase dashboard) is what fixes that
properly; it is not a code change.

`/register` also exists and takes a password, but it only creates an auth
account — it does not create or link a membership, so it lands in the same
place as an unknown address. Prefer the sign-in link.

**Unknown addresses are refused.** Since `fix(auth): stop the login page
minting accounts for unknown emails`, `/login` checks the address first and
sends nothing unless either a member record exists for it, or an auth account
already does. Before that, typing any address created a real account that could
never be linked to a membership and had no way to fix itself.

## The four roles

```ts
type UserRole = 'Member' | 'Office Staff' | 'Office Manager' | 'Admin'
```

Roles are an **array** on the user, stored in the `user_roles` table — a person
holds several, and every staff member also holds `Member`. Never compare a
single role field.

Two facts that surprise people:

- **A role is not a membership.** They are independent: `user_roles` grants
  access to `/admin`, a `members` row with your `auth_user_id` gives you a
  membership. An account can have either, both, or neither. With neither, you
  can sign in and see nothing.
- **A member record is linked by email.** `/api/auth/link-member` runs on every
  sign-in and claims any `members` row whose `primary_email` matches and whose
  `auth_user_id` is still null. So the office creates the row first; the link
  happens by itself on first sign-in.

## What each role unlocks

Verified against the code on 2026-09-01. Where this table and the code
disagree, **the code wins** — re-read the `ProtectedRoute` calls.

| Area | Required roles | Set in |
|---|---|---|
| `/member/**` — all 21 routes | authenticated, no role needed | `app/member/layout.tsx` |
| `/admin/**` — the default | `Office Staff`, `Office Manager`, `Admin` | `app/admin/layout.tsx` |
| `/admin/settings/staff-roles` | **`Admin` only** | its own `ProtectedRoute` |
| `/admin/login-activity` | `Admin`, `Office Manager` | its own `ProtectedRoute` |
| `/admin/members/[id]/login-activity` | `Admin`, `Office Manager` | its own `ProtectedRoute` |
| `/admin/test-accounts` | `Admin`, `Office Manager` | its own `ProtectedRoute` |
| `/admin/portal-settings` | `Office Manager`, `Admin` | its own `ProtectedRoute` |
| `/admin/zelle/settings` | `Office Manager`, `Admin` | its own `ProtectedRoute` |
| `/admin/settings/appearance` | `Admin`, via an inline check | in the page body |
| `/verify-qr` | `Office Staff`, `Office Manager`, `Admin` | outside both sections |

Everything else under `/admin` — including `/admin/members/new`, `[id]/edit`
and `/import` — takes the section default of **any staff role**. That is
looser than some older docs claim; it was left as-is deliberately (DEC-004).

Those seven narrower gates are the reason a page keeps its own nested
`ProtectedRoute`. **Removing one silently widens access.**

## Granting a role, linking a membership

- **Grant or remove a role:** `/admin/settings/staff-roles`, as an `Admin`.
  The member must already have an auth account — the page disables the control
  until `auth_user_id` is set, i.e. until they have signed in once.
- **Link a membership:** create the `members` row with the right
  `primary_email`; the next sign-in links it automatically. To check, open the
  member in `/admin/members/[id]` — it shows *Linked* or *Not linked*.

## Known gaps

Run `node scripts/list-access.mjs` for the current state; as of 2026-09-01:

- **No account holds `Office Staff` or `Office Manager`.** Only `Admin` is held,
  by two accounts. Those two role gates have therefore never been exercised —
  worth creating one of each before trusting them.
- **Most auth accounts have no member record**, so they sign in successfully and
  then see "No membership found" everywhere.
- **An auth user who has accepted the terms cannot be deleted.**
  `terms_acceptances_auth_user_id_fkey` has no `ON DELETE CASCADE`, so the
  delete fails with `23503`. Clear the `terms_acceptances` row first.

## Related

- `components/auth/RoleGate.tsx` — the three ways to gate UI. Do not invent a fourth.
- `docs/PROJECT-HUB.md` — decisions log, including DEC-004 on why the gates were not tightened.
