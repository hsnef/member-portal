/**
 * Emails for Zelle payments and office alerts. Spec: docs/architecture/payments.md.
 * Every member email carries the reference code and what is owed, so it can be
 * acted on from the email alone (from a banking app, away from the portal).
 */

import { emailWrapper } from '@/lib/email/templates'
import { EMAIL } from '@/lib/email/theme'
import { formatCurrency } from '@/utils/format'

type Email = { subject: string; html: string; text: string }

export interface ZelleEmailRequest {
  reference_code: string
  description: string
  amount_due: number
  expires_at: string
}
export interface ZelleRecipient {
  recipientName: string
  email: string
  phone: string
}

const money = (n: number) => formatCurrency(n, true)
const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' })
const portal = () => process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function sendTo(r: ZelleRecipient): string {
  return [r.email, r.phone].filter(Boolean).join(' or ')
}

function steps(req: ZelleEmailRequest, r: ZelleRecipient, amount = req.amount_due) {
  const lines = [
    `Open Zelle in your banking app and send ${money(amount)} to ${sendTo(r)} (${r.recipientName}).`,
    `In the memo, write ${req.reference_code}. That is how the office matches your payment.`,
    `Then, in the portal, press "I've sent it".`,
  ]
  const code = `<strong style="color:${EMAIL.saffron}">${req.reference_code}</strong>`
  return {
    html: `<ol style="padding-left:20px;line-height:1.7">${lines
      .map((l) => `<li>${esc(l).replace(req.reference_code, code)}</li>`)
      .join('')}</ol>`,
    text: lines.map((l, i) => `${i + 1}. ${l}`).join('\n'),
  }
}

export function zelleInstructionsEmail(name: string, req: ZelleEmailRequest, r: ZelleRecipient): Email {
  const s = steps(req, r)
  return {
    subject: `How to pay ${money(req.amount_due)} by Zelle (${req.reference_code})`,
    html: emailWrapper(`
      <h2 style="color:${EMAIL.saffron};margin-top:0">Paying by Zelle</h2>
      <p>Dear ${esc(name)},</p>
      <p>Thank you. Here is how to pay for <strong>${esc(req.description)}</strong>:</p>
      ${s.html}
      <p>Please pay by <strong>${day(req.expires_at)}</strong>. After that the request expires, and you can start a new one.</p>
      <p>Your receipt is emailed as soon as the office confirms the money has arrived.</p>
      <p><a href="${portal()}/member/payments">See your payments in the portal</a></p>`),
    text: `Paying by Zelle\n\nDear ${name},\n\nHere is how to pay for ${req.description}:\n\n${s.text}\n\nPlease pay by ${day(req.expires_at)}. Your receipt is emailed when the office confirms the money has arrived.\n\n${portal()}/member/payments`,
  }
}

export function zelleReminderEmail(name: string, req: ZelleEmailRequest, r: ZelleRecipient): Email {
  const s = steps(req, r)
  return {
    subject: `Reminder: ${money(req.amount_due)} by Zelle (${req.reference_code})`,
    html: emailWrapper(`
      <h2 style="color:${EMAIL.saffron};margin-top:0">A reminder about your Zelle payment</h2>
      <p>Dear ${esc(name)},</p>
      <p>We have not yet heard about your payment for <strong>${esc(req.description)}</strong>. If you have already sent it, please press "I&rsquo;ve sent it" in the portal; otherwise:</p>
      ${s.html}
      <p>The request expires on <strong>${day(req.expires_at)}</strong>.</p>`),
    text: `A reminder about your Zelle payment\n\nDear ${name},\n\nWe have not yet heard about your payment for ${req.description}. If you have already sent it, press "I've sent it" in the portal; otherwise:\n\n${s.text}\n\nThe request expires on ${day(req.expires_at)}.`,
  }
}

export function zelleBalanceDueEmail(
  name: string,
  req: ZelleEmailRequest,
  r: ZelleRecipient,
  received: number,
  balance: number,
): Email {
  const s = steps(req, r, balance)
  return {
    subject: `${money(balance)} still to pay (${req.reference_code})`,
    html: emailWrapper(`
      <h2 style="color:${EMAIL.saffron};margin-top:0">Thank you: part of your payment has arrived</h2>
      <p>Dear ${esc(name)},</p>
      <p>We received ${money(received)} for <strong>${esc(req.description)}</strong>, which is ${money(req.amount_due)}. <strong>${money(balance)}</strong> is still to pay:</p>
      ${s.html}
      <p>Your receipt is emailed once the full amount has arrived.</p>`),
    text: `Part of your payment has arrived\n\nDear ${name},\n\nWe received ${money(received)} for ${req.description}, which is ${money(req.amount_due)}. ${money(balance)} is still to pay:\n\n${s.text}`,
  }
}

export function zelleNotReceivedEmail(name: string, req: ZelleEmailRequest, reason: string): Email {
  return {
    subject: `We could not find your Zelle payment (${req.reference_code})`,
    html: emailWrapper(`
      <h2 style="color:${EMAIL.saffron};margin-top:0">We could not find your Zelle payment</h2>
      <p>Dear ${esc(name)},</p>
      <p>The office could not find a Zelle payment of ${money(req.amount_due)} for <strong>${esc(req.description)}</strong> (${req.reference_code}).</p>
      ${reason ? `<p><em>${esc(reason)}</em></p>` : ''}
      <p>If you have sent it, please reply with your bank&rsquo;s confirmation number and we will look again. Otherwise you can pay again from the portal.</p>`),
    text: `We could not find your Zelle payment\n\nDear ${name},\n\nThe office could not find a Zelle payment of ${money(req.amount_due)} for ${req.description} (${req.reference_code}).${reason ? `\n\n${reason}` : ''}\n\nIf you sent it, reply with your bank's confirmation number. Otherwise you can pay again from the portal.`,
  }
}

export function zelleExpiredEmail(name: string, req: ZelleEmailRequest, releasedPlace: boolean): Email {
  const released = releasedPlace ? ' The place we were holding for you has been released.' : ''
  return {
    subject: `Your Zelle request has expired (${req.reference_code})`,
    html: emailWrapper(`
      <h2 style="color:${EMAIL.saffron};margin-top:0">Your Zelle request has expired</h2>
      <p>Dear ${esc(name)},</p>
      <p>We did not receive the ${money(req.amount_due)} for <strong>${esc(req.description)}</strong> in time, so request ${req.reference_code} has closed.${released}</p>
      <p>If you have already sent it, please contact the office with your bank&rsquo;s confirmation number. You can start again from the portal at any time.</p>`),
    text: `Your Zelle request has expired\n\nDear ${name},\n\nWe did not receive the ${money(req.amount_due)} for ${req.description} in time, so request ${req.reference_code} has closed.${released}\n\nIf you already sent it, contact the office with your bank's confirmation number.`,
  }
}

/** An email to the office alert list: what happened, and where to act. */
export function officeAlertEmail(subject: string, lines: string[], link: { path: string; label: string }): Email {
  const url = `${portal()}${link.path}`
  return {
    subject: `[HSNEF office] ${subject}`,
    html: emailWrapper(`
      <h2 style="color:${EMAIL.saffron};margin-top:0">${esc(subject)}</h2>
      ${lines.map((l) => `<p>${esc(l)}</p>`).join('')}
      <p><a href="${url}" style="display:inline-block;background:${EMAIL.saffron};color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:bold">${esc(link.label)}</a></p>
      <p style="color:#999;font-size:12px">You get this because you are on the office alert list (Portal Settings).</p>`),
    text: `${subject}\n\n${lines.join('\n')}\n\n${link.label}: ${url}\n\nYou get this because you are on the office alert list (Portal Settings).`,
  }
}
