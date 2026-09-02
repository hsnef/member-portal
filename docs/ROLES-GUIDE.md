# What each role can do

A practical guide to the four roles: what a person holding each one actually
sees and can do. For the mechanics — how roles are stored, how a member record
links to an account, how to grant one — see
[`docs/ACCESS-AND-ROLES.md`](ACCESS-AND-ROLES.md).

Roles are **cumulative in practice but not in code**. There is no hierarchy: an
Office Manager is not automatically Office Staff. A person holds a *list* of
roles, and each gate checks whether the list contains one it accepts. In
practice every staff gate accepts Admin, so Admin reaches everything.

---

## Member

**Who:** every temple member. Requires a `members` record, not a role row.

Signs in and manages their own household. They see only their own data — RLS
enforces this in the database, so it holds even if a page forgets to filter.

| They can | Where |
|---|---|
| See their membership status and expiry | `/member` |
| Show a QR pass for check-in at the temple | `/member/pass` |
| Edit their own profile and family members | `/member/profile`, `/member/family` |
| Book a service or puja | `/member/bookings/new` |
| Register for an event | `/member/events` |
| Donate, renew, pay | `/member/donate`, `/member/renew`, `/member/payments` |
| Raise a request to the office | `/member/requests` |

**Cannot:** see another member, reach anything under `/admin`, or change their
own membership level or expiry. Those are office actions.

---

## Office Staff

**Who:** the front desk. The day-to-day role.

Everything a Member can do, plus the whole office console **except** the four
areas listed under Office Manager below.

| They can | Where |
|---|---|
| Look up any member, edit their details | `/admin/members` |
| Create a new member, or import a batch | `/admin/members/new`, `/import` |
| Process applications from prospective members | `/admin/pending-registrations` |
| Take and review bookings and requests | `/admin/bookings`, `/admin/requests` |
| Record payments, confirm Zelle, issue receipts | `/admin/payments`, `/admin/zelle`, `/admin/receipts` |
| Create and run events | `/admin/events` |
| Manage services and priests | `/admin/services`, `/admin/settings/priests` |
| Check members in by scanning their QR pass | `/admin/scan-qr`, `/verify-qr` |
| Read the audit trail | `/admin/audit-logs` |

**Cannot:** see who signed in and when, change portal-wide settings, configure
Zelle, manage test accounts, or grant anyone a role.

> Note this is **wider than you might expect**: creating, editing and importing
> members are all Office Staff actions, not manager-only. That was a deliberate
> decision, recorded as DEC-004 — the code was not tightened during the redesign.

---

## Office Manager

**Who:** whoever runs the office. Oversight, not extra day-to-day work.

Everything Office Staff can do, plus four areas:

| They can additionally | Where |
|---|---|
| See sign-in activity for the portal and per member | `/admin/login-activity`, `/admin/members/[id]/login-activity` |
| Change portal-wide settings | `/admin/portal-settings` |
| Configure where Zelle payments are sent | `/admin/zelle/settings` |
| Create and clean up test accounts | `/admin/test-accounts` |

**Cannot:** grant or remove roles. Only an Admin does that — so a manager cannot
promote themselves or anyone else.

---

## Admin

**Who:** one or two technical owners. Not an everyday account.

Everything above, plus:

| They can additionally | Where |
|---|---|
| Grant and remove staff roles | `/admin/settings/staff-roles` |
| Change the portal's appearance and theme | `/admin/settings/appearance` |

Admin is the only role that can change who else has access, which makes it the
one to hand out sparingly.

---

## Choosing a role

- A new front-desk volunteer → **Office Staff**
- Someone who needs to see login activity or change settings → **Office Manager**
- Someone who needs to give *other people* access → **Admin**
- A temple member with no office duties → no role at all; a `members` record is
  all they need

## Two things that surprise people

**A role and a membership are separate.** `user_roles` opens `/admin`; a
`members` row with your `auth_user_id` gives you a membership. An account can
hold either, both, or neither — and an account with neither is now signed out
automatically, because it can do nothing.

**Granting a role needs a member record first.** `/admin/settings/staff-roles`
searches the `members` table, so someone with a sign-in account but no member
record is invisible to it. Create the member record first, have them sign in
once so it links, then grant the role.

## Test accounts

Four accounts exist on the dev project, one per role, so gates can be checked
without touching a real person's access. Sign in to any of them with
"Email me a sign-in link" — there are no passwords.

Run `node scripts/list-access.mjs` for the current list, which is authoritative;
as of 2026-09-01 it is `dev-mp@hsnef.org` and `dev-mp+testadmin@hsnef.org`
(Admin), `dev-mp+testmanager@hsnef.org` (Office Manager) and
`dev-mp+teststaff@hsnef.org` (Office Staff).
