import { beforeEach, describe, expect, it, vi } from 'vitest'
import { emailReceipt, purposeFor, settlePayment, stripeKey } from './settle'
import { paymentMethodLabel } from './labels'

// The database function itself is tested against the dev database
// (supabase/tests/settle_payment.sql). These tests cover what the server code
// does around it: the arguments it sends, and the receipt email.

let rpcArgs: Record<string, unknown> | null
let rpcResult: { data: unknown; error: { message: string } | null }
let receipt: Record<string, unknown>
const updates: Array<Record<string, unknown>> = []

const db: any = {
  rpc: vi.fn(async (_fn: string, args: Record<string, unknown>) => {
    rpcArgs = args
    return rpcResult
  }),
  from: (table: string) => {
    const q: any = {
      select: () => q,
      eq: () => q,
      single: async () =>
        table === 'receipts'
          ? { data: receipt, error: null }
          : { data: { primary_email: 'member@example.org', first_name: 'A', last_name: 'Member' }, error: null },
      update: (row: Record<string, unknown>) => {
        updates.push(row)
        return q
      },
    }
    return q
  },
}
const send = vi.fn(async (_: unknown) => ({ success: true }) as any)

beforeEach(() => {
  rpcArgs = null
  rpcResult = {
    data: [{ payment_id: 'pay-1', receipt_id: 'rcp-1', receipt_number: 'RCP-2026-000001', already_settled: false }],
    error: null,
  }
  receipt = {
    id: 'rcp-1',
    receipt_number: 'RCP-2026-000001',
    member_id: 'm-1',
    amount: '150.00', // numeric columns can arrive as strings
    payment_method: 'Stripe',
    purpose: 'Membership',
    receipt_date: '2026-03-01T17:00:00Z',
    email_sent_at: null,
  }
  updates.length = 0
  send.mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('settlePayment', () => {
  it('sends a membership payment to settle_payment with the level and the Stripe intent', async () => {
    const out = await settlePayment(
      {
        idempotencyKey: stripeKey('pi_1'),
        memberId: 'm-1',
        method: 'Stripe',
        amount: 150,
        target: { kind: 'membership', level: 'Annual' },
        stripePaymentIntentId: 'pi_1',
      },
      { db, send },
    )
    expect(rpcArgs).toMatchObject({
      p_idempotency_key: 'stripe:pi_1',
      p_member_id: 'm-1',
      p_purpose: 'Membership',
      p_method: 'Stripe',
      p_amount: 150,
      p_target_kind: 'membership',
      p_target_id: null,
      p_level: 'Annual',
      p_stripe_payment_intent_id: 'pi_1',
    })
    expect(out).toMatchObject({ paymentId: 'pay-1', receiptNumber: 'RCP-2026-000001', alreadySettled: false, receiptEmailed: true })
  })

  it('passes the item id for a booking and records it as a Service payment', async () => {
    await settlePayment(
      { idempotencyKey: 'office:1', memberId: 'm-1', method: 'Cash', amount: 51, target: { kind: 'booking', id: 'bk-1' }, createdBy: 'staff-1' },
      { db, send },
    )
    expect(rpcArgs).toMatchObject({ p_target_kind: 'booking', p_target_id: 'bk-1', p_purpose: 'Service', p_level: null, p_created_by: 'staff-1' })
  })

  it('refuses a zero or negative amount before touching the database', async () => {
    await expect(
      settlePayment({ idempotencyKey: 'x', memberId: 'm', method: 'Cash', amount: 0, target: { kind: 'donation' } }, { db, send }),
    ).rejects.toThrow(/positive/)
    expect(db.rpc).not.toHaveBeenCalledWith('settle_payment', expect.objectContaining({ p_amount: 0 }))
  })

  it('surfaces a database refusal (wrong amount, wrong member, already paid) as an error', async () => {
    rpcResult = { data: null, error: { message: 'amount 50 does not match the 51 due' } }
    await expect(
      settlePayment({ idempotencyKey: 'x', memberId: 'm', method: 'Cash', amount: 50, target: { kind: 'booking', id: 'b' } }, { db, send }),
    ).rejects.toThrow(/does not match/)
    expect(send).not.toHaveBeenCalled()
  })

  it('keeps the money recorded when the receipt email fails', async () => {
    send.mockResolvedValueOnce({ success: false, error: 'resend down' })
    const out = await settlePayment(
      { idempotencyKey: 'x', memberId: 'm-1', method: 'Zelle', amount: 25, target: { kind: 'request', id: 'q' } },
      { db, send },
    )
    expect(out.paymentId).toBe('pay-1')
    expect(out.receiptEmailed).toBe(false)
    expect(updates).toEqual([]) // not marked as emailed
  })
})

describe('emailReceipt', () => {
  it('emails the member once, with a readable method, and marks the receipt as sent', async () => {
    expect(await emailReceipt('rcp-1', { db, send })).toBe(true)
    const mail = send.mock.calls[0][0] as any
    expect(mail.to).toBe('member@example.org')
    expect(mail.subject).toContain('RCP-2026-000001')
    expect(mail.text).toContain('$150.00')
    expect(mail.text).toContain('Card (online)')
    expect(updates[0]).toHaveProperty('email_sent_at')
  })

  it('does not email a receipt that was already sent', async () => {
    receipt.email_sent_at = '2026-03-01T17:01:00Z'
    expect(await emailReceipt('rcp-1', { db, send })).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })
})

describe('labels', () => {
  it('names each target purpose and payment method the way members read them', () => {
    expect(purposeFor({ kind: 'event_registration', id: 'e' })).toBe('Event')
    expect(purposeFor({ kind: 'donation', purpose: 'Sponsorship' })).toBe('Sponsorship')
    expect(paymentMethodLabel('Card')).toBe('Card (at the temple)')
    expect(paymentMethodLabel('Check')).toBe('Cheque')
  })
})
