/**
 * Office alerts: one list of addresses, maintained by Admins in Portal
 * Settings (setting `office_alert_emails`), that hears about everything that
 * needs the office: a Zelle payment sent, a registration or booking awaiting
 * approval. Server only. Spec: docs/architecture/payments.md, "Office alerts".
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { sendEmail } from '@/lib/email/mailer'
import { officeAlertEmail } from '@/lib/email/templates/zelle'

type Client = SupabaseClient<Database>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Clean a list an Admin typed: trimmed, lower-cased, valid, no repeats. */
export function normaliseAlertEmails(input: unknown): string[] {
  const list = Array.isArray(input) ? input : typeof input === 'string' ? input.split(/[\s,;]+/) : []
  const out: string[] = []
  for (const raw of list) {
    const e = String(raw).trim().toLowerCase()
    if (EMAIL_RE.test(e) && !out.includes(e)) out.push(e)
  }
  return out
}

export async function readAlertEmails(db: Client): Promise<string[]> {
  const { data } = await db.from('portal_settings').select('setting_value').eq('setting_key', 'office_alert_emails').maybeSingle()
  return normaliseAlertEmails((data?.setting_value as { value?: unknown } | null)?.value)
}

export interface OfficeAlert {
  subject: string
  lines: string[]
  link: { path: string; label: string }
}

/**
 * Email the alert to everyone on the list. Never throws: an alert that cannot
 * be sent is logged, and whatever triggered it still succeeds.
 */
export async function sendOfficeAlert(db: Client, alert: OfficeAlert, send = sendEmail): Promise<boolean> {
  try {
    const to = await readAlertEmails(db)
    if (to.length === 0) {
      console.warn('[office alert] the alert list is empty; not sent:', alert.subject)
      return false
    }
    const content = officeAlertEmail(alert.subject, alert.lines, alert.link)
    const sent = await send({
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      tags: [{ name: 'category', value: 'office-alert' }],
    })
    if (!sent.success) console.error('[office alert] not sent:', alert.subject, sent.error)
    return !!sent.success
  } catch (error) {
    console.error('[office alert] failed:', alert.subject, error)
    return false
  }
}
