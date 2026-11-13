import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseOfficePayment, recordOfficePayment } from './office'

const ID = '0b0c3f1e-6a52-4c7e-9d0a-2f0d4c6b8a11'

describe('parseOfficePayment', () => {
  const item = { kind: 'membership', level: 'Annual' } as const
  const base = { submissionId: ID, memberId: 'm-1', method: 'Cash' }

  it('accepts a complete form and trims what was typed', () => {
    expect(parseOfficePayment({ ...base, notes: '  paid at the counter ' }, item)).toMatchObject({
      submissionId: ID,
      method: 'Cash',
      notes: 'paid at the counter',
      item,
    })
  })

  it('says what is missing', () => {
    expect(parseOfficePayment({ ...base, submissionId: 'not-a-uuid' }, item)).toMatch(/form id/)
    expect(parseOfficePayment({ ...base, memberId: '' }, item)).toMatch(/who paid/)
    expect(parseOfficePayment({ ...base, method: 'Stripe' }, item)).toMatch(/how they paid/) // online card is not an office method
    expect(parseOfficePayment(base, null)).toMatch(/what the payment is for/)
    expect(parseOfficePayment({ ...base, method: 'Check' }, item)).toMatch(/cheque number/)
  })
})

describe('recordOfficePayment', () => {
  let rpcArgs: Record<string, unknown> | null
  let rpcError: { message: string } | null
  let member: Record<string, unknown> | null

  const db: any = {
    rpc: vi.fn(async (_: string, args: Record<string, unknown>) => {
      rpcArgs = args
      return rpcError
        ? { data: null, error: rpcError }
        : { data: [{ payment_id: 'p', receipt_id: 'r', receipt_number: 'RCP-2026-000009', already_settled: false }], error: null }
    }),
    from: (table: string) => {
      const q: any = {
        select: () => q,
        eq: () => q,
        update: () => q,
        maybeSingle: async () => ({ data: table === 'members' ? member : null, error: null }),
        // emailReceipt: pretend it was already sent, so nothing is mailed here.
        single: async () => ({ data: { email_sent_at: 'x' }, error: null }),
      }
      return q
    },
  }

  beforeEach(() => {
    rpcArgs = null
    rpcError = null
    member = { id: 'm-1', current_level: 'Community' }
  })

  it('records a counter membership through the settlement step, priced by the server, as the staff member', async () => {
    const out = await recordOfficePayment(db, 'staff-1', {
      submissionId: ID,
      memberId: 'm-1',
      method: 'Card',
      reference: '004512',
      item: { kind: 'membership', level: 'Lifetime' },
    })
    expect(out).toMatchObject({ ok: true, amount: 1008 }) // default Lifetime price
    expect(rpcArgs).toMatchObject({
      p_idempotency_key: `office:${ID}`,
      p_method: 'Card',
      p_amount: 1008,
      p_level: 'Lifetime',
      p_created_by: 'staff-1',
      p_notes: 'Card machine ref 004512',
      p_zelle_reference: null,
    })
  })

  it('keeps a Zelle confirmation number as the Zelle reference', async () => {
    await recordOfficePayment(db, 'staff-1', {
      submissionId: ID,
      memberId: 'm-1',
      method: 'Zelle',
      reference: 'ZL123',
      item: { kind: 'donation', amount: 21, fund: 'Annadanam' },
    })
    expect(rpcArgs).toMatchObject({ p_zelle_reference: 'ZL123', p_amount: 21, p_notes: 'Donation - Annadanam' })
  })

  it('refuses an unknown member, and passes on the database\'s reason for refusing', async () => {
    member = null
    expect(await recordOfficePayment(db, 's', { submissionId: ID, memberId: 'x', method: 'Cash', item: { kind: 'donation', amount: 5, fund: 'General' } })).toMatchObject({
      ok: false,
      status: 404,
    })
    member = { id: 'm-1', current_level: 'Community' }
    rpcError = { message: 'settle_payment: booking is Paid, not Approved' }
    expect(await recordOfficePayment(db, 's', { submissionId: ID, memberId: 'm-1', method: 'Cash', item: { kind: 'donation', amount: 5, fund: 'General' } })).toMatchObject({
      ok: false,
      error: 'booking is Paid, not Approved',
    })
  })
})
