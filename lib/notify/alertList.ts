/** The office alert list's shape, shared by the settings page and the server. No email code here. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const OFFICE_ALERTS_KEY = 'office_alert_emails'

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

export function isEmailAddress(s: string): boolean {
  return EMAIL_RE.test(s.trim())
}
