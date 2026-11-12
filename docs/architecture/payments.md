# Payments — specification (card, Zelle, office)

_Status: **agreed 2026-11-12** (Sujit: "go for the wider job"). Being built._
_Replaces the prototype in `lib/zelle/`, `app/admin/zelle/`, `app/pay/` and `components/zelle/`,
and the four separate "mark it paid" paths for card payments._

## Why this exists

Members pay the temple by card, by Zelle, and in person by cash or cheque. Every one of
those should end the same way: the payment is recorded once, the thing paid for is marked
paid, a numbered receipt is emailed, and the office sees it.

None of that works reliably today (audit, 2026-11-12):
- **Card payments are never recorded.** Stripe takes the money, but the portal's write is
  refused by the database (only staff may insert payments; the card paths run as the
  member or as nobody). No receipt, no status change.
- **Paid event registration cannot succeed** (it writes columns that do not exist).
- **Renewals never change the level** ("annual" vs "Annual") and **no membership dates are
  ever written**, so nobody's membership is extended.
- **Joining at Annual or Lifetime grants the level without payment.**
- **Amounts come from the browser** on every card payment.
- **The receipts table is never used**; PDFs invent a number; only card donations email.
- **Zelle** could not be switched on: members could not complete a payment, $50-and-under
  would have been marked paid unchecked, staff could confirm twice, no receipts.

## Settling a payment — the one step

`settlePayment` runs on the server only, with the service role, inside one database
transaction (a Postgres function). Given *what is being paid* and *what arrived*, it:

1. Claims the source so it can only settle once (a Stripe payment intent id is unique;
   a Zelle request moves out of its open state; an office entry is one form submit).
2. Inserts the `payments` row (method, purpose, amount, member, references, who).
3. Marks the item paid: booking → Paid (`payment_id`, `paid_at`); request → Paid;
   event → registration created and confirmed; membership → level and dates (below);
   donation → nothing else.
4. Inserts the `receipts` row (numbered `RCP-YYYY-NNNNNN` by the existing trigger).
5. After commit: emails the receipt; PDFs everywhere use the receipt number.

Card (Stripe webhook), Zelle (staff confirmation, bank import) and office-recorded
payments all call it. The browser never marks anything paid. The Stripe success pages
only *show* the result, reading it back from the server.

**The amount is always the server's.** A checkout starts from the item (booking id,
request id, event id, membership level, or a donation with its amount and fund); the
server works out the price and creates the Stripe payment intent or Zelle request for
exactly that.

## Membership

**Membership year** (from the temple's brief, `docs/reference/…-final-prompt-v3.md` §2.2):
Annual runs January 1 – December 31, with no prorating.
- Paid **Jan 1 – Sep 30** → valid to Dec 31 of this year.
- Paid **Oct 1 – Dec 31** → valid to Dec 31 of **next** year (about 15 months).
- Not renewed → back to Community; history kept. Lifetime never expires or drops.

Settling a membership payment writes a `memberships` row (level, year, start, end,
payment) and sets `members.current_level`. A member's level is only ever Annual or
Lifetime because a payment settled.

**Scenario A — applying from home.**
1. They apply at `/join`, choosing Community, Annual or Lifetime.
2. The office approves the application (approval is on). The member is created as
   **Community** whatever they chose, and gets the sign-in invitation.
3. If they chose Annual or Lifetime, their dashboard says **Complete your membership —
   $X**, with Card or Zelle. The approval email says the same, with the link.
4. Card: active at once, receipt emailed. Zelle: active when the office confirms it.
5. If they never pay, they stay a Community member, which is what they are entitled to.

Nobody pays before approval, so the temple never has to refund a rejected applicant.

**Scenario B — at the temple counter.**
1. Staff open **Add member** (office console), enter name and email, choose the level
   and, for a paid level, how they paid: cash, cheque or Zelle (sent from their phone at
   the counter).
2. Staff-created members need no approval. On save the member exists, the payment is
   settled through the same step, the level and dates are set, and the member is emailed
   the receipt and the sign-in invitation.
3. Zelle at the counter: staff confirm when it shows in the bank; until then it is an open
   Zelle request in the queue like any other.

**Membership pass (QR).** Every member has a pass with a QR code (`/member/pass`); staff
scan it at `/admin/scan-qr` and see the member at `/verify-qr`. Two fixes come with this
work: the QR signature is checked on the server (it was checked in the browser, which
never has the secret, so real passes fail and the public fallback key could forge one),
and the result shows the live membership — "Annual, valid to Dec 31, 2026", "Lifetime, no
expiry", "Expired — now Community" — read from the member's record, not from the level
printed into the QR at the time it was made.

**Counter payment methods:** cash, cheque, Zelle, and **Card (counter machine)** — kept
as an option (Sujit, 2026-11-12) so card payments taken on the temple's own machine are
recorded and receipted like the rest.

## Principles (Zelle)

1. **Zelle is a payment method, not a feature.** Anywhere a member can pay by card, they
   can choose Zelle: joining, renewing or upgrading, donations, puja and service
   bookings, requests, event registrations.
2. **One way to mark something paid:** `settlePayment`, above.
3. **A person confirms money.** No automatic confirmation from the member's say-so.
4. **Nothing disappears.** Every Zelle request is visible to the office until it is paid,
   cancelled or expired, and expired ones stay findable.
5. **Simple to follow.** One reference code, one queue, two buttons.

## Zelle — the member's journey

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

## Zelle — the office's journey

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

**If the bank never provides a file**, nothing is lost: the import is a speed-up, not a
dependency. The office checks the Zelle activity in the bank's app or website and presses
**Confirm received** in the queue, matching on the reference code in the memo. Every part
of the flow works without the file.

## What an Admin sets (Portal Settings → Zelle)

| Setting | Default | Notes |
|---|---|---|
| Zelle on/off | **off** | Can only be switched on once a recipient is set |
| Recipient email and/or phone | — | Validated; shown to members |
| Recipient name | Hindu Society of North East Florida | What the bank shows the member |
| Days to pay before a reminder | 3 | |
| Days to pay before the request expires | 7 | |
| Hold a booking or event place while Zelle is pending | **on** | If off, the place is only taken once paid |

Changing a setting needs no code change or release: an Admin edits it and it applies
to Zelle requests created from then on. Requests already open keep the dates they were
given, so nobody's deadline moves under them.

When a request expires, the member is told; a held booking or event place is released.
Renewals and donations have nothing to release.

Best practice behind the defaults: a week is long enough for a member to pay from their
banking app, short enough that a held puja slot is not blocked for a month, and one
reminder halfway catches most "forgot to send it".

## Office alerts (one list, maintained by Admins)

**Portal Settings → Office alerts**: a list of email addresses an Admin adds to and
removes from, themselves included. Every alert the portal sends to the office goes to
everyone on it. Starts with `dev-mp@hsnef.org` on both sites (seeded by the migration).

It is one list for all office alerts, not a Zelle-only list, because the portal has none
today: nobody is emailed when someone registers and needs approval, or when a booking
needs approving. This work sends three alerts to it:

| Alert | When |
|---|---|
| Zelle payment sent | A member presses **I've sent it** |
| Registration awaiting approval | Someone joins and approval is on |
| Booking awaiting approval | A member submits a booking |

Each alert links straight to the item in the office console.

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

- Card: each purpose, paid on dev with Stripe test cards by a real member, is recorded
  once, marks the item paid, writes a receipt and emails it — even if the member closes
  the tab straight after paying (the webhook settles it).

- Every payment type above can be paid by Zelle end to end on dev, as a real member
  (not an Admin) and as Office Staff.
- No page in the browser marks anything paid.
- Tests: the confirmation step (exact, short, over, twice, wrong role), expiry, the bank
  file matcher (matched, possible, unmatched, duplicates), reference code format.
- All Zelle screens on the design system; no type errors in the touched files.
- Migrations applied to dev; production with the release, by Sujit.

## Decisions (Sujit, 2026-11-12)

0. The work covers card, Zelle and office payments for every purpose, through one
   settlement step (Sujit: "go for the wider job"). Joining at a paid level: approve,
   then pay; Community until paid. Membership year as in the temple's brief (above).

1. Defaults accepted: 7 days to pay, reminder at 3, hold places on. Admin-editable.
2. Bank CSV import is built in; a sample export from the temple's bank follows the build.
   Without one, the office confirms by hand (above).
3. Office alerts go to an Admin-maintained list, starting with `dev-mp@hsnef.org`.
