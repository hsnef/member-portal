import { describe, expect, it, vi } from 'vitest'
import { normaliseAlertEmails, sendOfficeAlert } from './office'

describe('office alert list', () => {
  it('cleans what an Admin typed: trims, lower-cases, drops invalid and repeated addresses', () => {
    expect(normaliseAlertEmails([' Dev-MP@hsnef.org', 'office@hsnef.org', 'not an email', 'dev-mp@hsnef.org'])).toEqual([
      'dev-mp@hsnef.org',
      'office@hsnef.org',
    ])
    expect(normaliseAlertEmails('a@hsnef.org, b@hsnef.org; c@hsnef.org')).toEqual(['a@hsnef.org', 'b@hsnef.org', 'c@hsnef.org'])
    expect(normaliseAlertEmails(null)).toEqual([])
  })

  const dbWith = (value: unknown): any => ({
    from: () => {
      const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { setting_value: { value } }, error: null }) }
      return q
    },
  })
  const alert = { subject: 'Zelle sent: $31.00', lines: ['Pay Tester says they sent it.'], link: { path: '/admin/zelle', label: 'Open the queue' } }

  it('emails everyone on the list, with a link to act on it', async () => {
    const send = vi.fn(async (_: any) => ({ success: true }) as any)
    expect(await sendOfficeAlert(dbWith(['dev-mp@hsnef.org', 'office@hsnef.org']), alert, send)).toBe(true)
    const mail = send.mock.calls[0][0]
    expect(mail.to).toEqual(['dev-mp@hsnef.org', 'office@hsnef.org'])
    expect(mail.subject).toBe('[HSNEF office] Zelle sent: $31.00')
    expect(mail.text).toContain('/admin/zelle')
  })

  it('never fails the action that raised it: an empty list or a failed send just returns false', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const send = vi.fn(async (_: any) => ({ success: false, error: 'down' }) as any)
    expect(await sendOfficeAlert(dbWith([]), alert, send)).toBe(false)
    expect(send).not.toHaveBeenCalled()
    expect(await sendOfficeAlert(dbWith(['dev-mp@hsnef.org']), alert, send)).toBe(false)
    const throwing = vi.fn(async () => {
      throw new Error('boom')
    })
    expect(await sendOfficeAlert(dbWith(['dev-mp@hsnef.org']), alert, throwing as any)).toBe(false)
  })
})
