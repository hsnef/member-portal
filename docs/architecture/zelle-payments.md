# Zelle payments — specification

_Status: **proposed 2026-11-12**, for Sujit's sign-off. Nothing here is built yet._
_Replaces the prototype in `lib/zelle/`, `app/admin/zelle/`, `app/pay/` and `components/zelle/`._

## Why this exists

Members already pay the temple by Zelle. The portal should make that as easy as a card
payment for the member, and make it quick and safe for the office to confirm, without
anyone keeping a separate spreadsheet. The portal cannot see the bank account, so money
is only ever marked received by a person, or by a bank file a person uploads.

The prototype could not be switched on: members could not complete a payment (the
database refused it), $50-and-under payments would have been marked paid unchecked,
staff could confirm a payment twice, and no receipts were sent. See the audit in the
2026-11-12 session handoff in `PROJECT-HUB.md`.

## Principles

1. **Zelle is a payment method, not a feature.** Anywhere a member can pay by card, they
   can choose Zelle: joining, renewing or upgrading, donations, puja and service
   bookings, requests, event registrations.
2. **One way to mark something paid.** A single server-side step records the payment,
   marks the item paid (booking, renewal, registration, request), creates the receipt and
   emails it. Card, Zelle and office-recorded cash/cheque all go through it. Today that
   logic is copied in four places and the booking one runs in the member's browser; this
   work replaces all four.
3. **A person confirms money.** No automatic confirmation from the member's say-so.
4. **Nothing disappears.** Every Zelle request is visible to the office until it is paid,
   cancelled or expired, and expired ones stay findable.
5. **Simple to follow.** One reference code, one queue, two buttons.

## The member's journey

1. At checkout the member picks **Card** or **Zelle**.
2. Zelle shows: the amount, the temple's Zelle email/phone, a QR code, and a reference
   code such as `HSNEF-7K3Q9P`, with "put this code in the Zelle memo". It is also
   emailed to them, so they can pay later from their banking app.
3. The item shows **Awaiting Zelle payment** in their portal, with the same details.
4. They press **I've sent it** (optionally adding their bank's confirmation number).
   The office is emailed. The member sees **Payment sent — the office will confirm**.
5. When the office confirms, the member gets the normal receipt and the item becomes
   paid, exactly as after a card payment.
6. If the money does not arrive, they get a reminder, then the request expires (below).

## The office's journey

**Zelle queue** (`/admin/zelle`), three tabs: **Member says sent** (work these first),
**Awaiting payment**, **Closed** (paid, cancelled, expired — searchable).
Each row: reference, member, what it is for, amount due, age, member's bank number.

- **Confirm received** — staff enter the amount that arrived (pre-filled with the amount
  due) and the date. Then:
  - **Exact:** paid. Receipt sent.
  - **Short:** stays open with **balance due $X**; the member is emailed to send the
    difference with the same reference. Not marked paid until the full amount is in.
  - **Over:** paid, and staff choose: **record the extra as a donation** or **refund it
    outside the portal** (noted on the payment). This is the only "wrong amount" logic;
    there are no instalment plans.
- **Not received** — with a short reason; the member is emailed and can pay again.
- **Cancel** — for a request raised in error.

A payment can only be confirmed once: the confirmation claims the request in the database
before anything else is written, so two staff or two tabs cannot both record it.

**Record a Zelle payment** — for money that arrives without a portal request (a phone
call, someone at the front desk). Staff pick the person, what it was for and the amount,
and it goes through the same confirmation step. If the person is not yet a member, staff
add them as a **Community** member (free) in the same form: name and email. That matches
how the portal treats anyone who deals with the temple — they become a Community member,
and can upgrade to Annual or Lifetime later. Email is required, because it is where the
receipt goes.

**Bank file import** — staff upload the bank's transaction export (CSV). The first time,
an Admin maps its columns (date, amount, memo, sender); the mapping is saved. The portal
then lists:
- **Matched** — reference code found in the memo and amount equal: ticked, ready.
- **Possible** — amount and sender name match an open request but no code: unticked.
- **Unmatched** — shown for the office to record or ignore.

Staff review and press **Confirm N payments**; each goes through the same confirmation
step. Rows already imported are recognised and skipped, so uploading an overlapping file
is safe. (Needs one sample export from the temple's bank to test against.)

## What an Admin sets (Portal Settings → Zelle)

| Setting | Default | Notes |
|---|---|---|
| Zelle on/off | **off** | Can only be switched on once a recipient is set |
| Recipient email and/or phone | — | Validated; shown to members |
| Recipient name | Hindu Society of North East Florida | What the bank shows the member |
| Days to pay before a reminder | 3 | |
| Days to pay before the request expires | 7 | |
| Hold a booking or event place while Zelle is pending | **on** | If off, the place is only taken once paid |

When a request expires, the member is told; a held booking or event place is released.
Renewals and donations have nothing to release.

Best practice behind the defaults: a week is long enough for a member to pay from their
banking app, short enough that a held puja slot is not blocked for a month, and one
reminder halfway catches most "forgot to send it".

## Security

- Members never write to Zelle tables directly. Creating a request, "I've sent it" and
  cancelling go through server routes; confirming goes through a database function that
  checks the caller is office staff.
- The amount is set by the server from the item being paid, never by the browser.
- A member can only see and act on their own requests.
- Every confirmation, rejection and cancellation is recorded with who did it and when.

## Removed from the prototype

Auto-confirm, the unused signed QR token (and its known weakness), the quick-pay page
(replaced by **Record a Zelle payment**), and the public `/pay/[reference]` page
(the member's own portal shows the details instead).

## Done means

- Every payment type above can be paid by Zelle end to end on dev, as a real member
  (not an Admin) and as Office Staff.
- Card payments go through the same single "mark paid" step, and the booking
  payment-success page no longer marks anything paid itself.
- Tests: the confirmation step (exact, short, over, twice, wrong role), expiry, the bank
  file matcher (matched, possible, unmatched, duplicates), reference code format.
- All Zelle screens on the design system; no type errors in the touched files.
- Migrations applied to dev; production with the release, by Sujit.

## Open questions for Sujit

1. The defaults above (7 days to pay, reminder at 3, hold places on): accept?
2. A sample CSV export from the temple's bank, for the import (can follow the build;
   the matcher is tested on a made-up file until then).
3. Who receives the "member says sent" alert: the office address (`office@hsnef.org`),
   or a list set in Portal Settings?
