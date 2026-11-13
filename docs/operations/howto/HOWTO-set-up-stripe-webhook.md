---
title: Set up the Stripe webhook
last_checked: 2026-11-13
roles: [admin, developer]
---

# Stripe webhook: steps for the temple's Stripe administrator

_Written 2026-11-12; steps checked against the code 2026-11-13._ For whoever administers the HSNEF Stripe account. About 15 minutes.
No code, and nothing changes for existing payments._

## Why we are asking

When a member pays by card on the member portal, Stripe takes the payment and the portal
records it: marks the booking or membership paid and emails the receipt. The portal does this
when the member's browser comes back from Stripe.

If the member closes the browser in the moment between paying and coming back, the portal
only hears about the payment if Stripe tells it directly. That message is a **webhook**. With
it set up, every payment is recorded even if the member walks away. Without it, the money
is safe in Stripe but the office would have to record that payment by hand.

We need two webhooks, one for the test site and one for the real site, and from each one
a **signing secret**: the code that proves a message really came from Stripe.

## What you will send back

| | Test site | Real site |
|---|---|---|
| Stripe mode | **Test mode** (or the sandbox the test site uses) | **Live mode** |
| Webhook address | `https://dev.member.hsnef.org/api/stripe/webhook` | `https://member.hsnef.org/api/stripe/webhook` |
| You send back | its signing secret (`whsec_…`) | its signing secret (`whsec_…`) |

**Send the two secrets privately**, for example by phone or a password manager share, not by
email or chat, and label which is which. They are not passwords to the Stripe account, but
anyone holding one could send fake "payment succeeded" messages to the portal.

## Steps (do them twice: once in Test mode, once in Live mode)

1. Sign in to the Stripe Dashboard (dashboard.stripe.com) with the HSNEF account.
2. **Choose the mode.**
   - For the test site: switch on **Test mode** (top right). If your account uses
     **Sandboxes** instead, open the sandbox whose API keys the portal's test site uses.
     The portal team can tell you which by the start of the publishable key (`pk_test_…`).
   - For the real site: make sure Test mode is **off** (Live).
3. Go to **Developers → Webhooks**. This may be shown as **Workbench → Webhooks**, or
   **Event destinations**.
4. Click **Add endpoint**. It may be called **Add destination**, and then you choose
   **Webhook endpoint**.
5. **Events to send.** Choose these two, and only these:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   If asked for an API version, leave the account's default.
6. **Endpoint URL.** Paste the address for this mode from the table above. If there's a
   Description field, enter "HSNEF member portal".
7. Save (**Add endpoint** / **Create destination**).
8. On the new endpoint's page, find **Signing secret**, click **Reveal**, and copy it. It
   starts with `whsec_`.
9. Send it to the portal team as described above, saying whether it's the **test** or the
   **live** one.

## Afterwards (the portal team)

1. In Vercel, project `member` → Settings → Environment Variables, set
   `STRIPE_WEBHOOK_SECRET`:
   - **Preview** (the test site, dev.member.hsnef.org): the **test** secret.
   - **Production** (member.hsnef.org): the **live** secret.
2. Redeploy each environment, so it picks up the new value.
3. **Check the test site.** Pay for something on dev.member.hsnef.org with Stripe's test
   card 4242 4242 4242 4242. In Stripe (Test mode) → the endpoint → **Event deliveries**,
   the `payment_intent.succeeded` event shows **200 OK**.
4. **Check the real site** after the first real card payment: same place in Live mode,
   **200 OK**. A failed delivery shows the reason; Stripe retries for three days, and the
   portal records each payment only once however many times it hears about it.

## If you would rather not use webhooks

The portal still works: payments are recorded when the member's browser returns, which is
nearly always. The rare payment where the member closed the tab shows in Stripe but not in
the portal, and the office records it by hand. We recommend the webhook.

## Reference

- The portal's handler: `app/api/stripe/webhook/route.ts`. It verifies the signature and
  records the payment through the one settlement step (`docs/architecture/payments.md`).
- Checked 2026-11-12: both addresses are reachable by Stripe. A test request without a
  signature is refused by the portal with 400, as it should be.
