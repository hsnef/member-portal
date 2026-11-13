import { describe, expect, it, vi } from 'vitest'
import { metadataToTarget, settleStripeIntent, targetToMetadata } from './stripe'
import type { SettleTarget } from './settle'

describe('payment intent metadata', () => {
  it('round-trips every kind of target', () => {
    const targets: SettleTarget[] = [
      { kind: 'membership', level: 'Lifetime' },
      { kind: 'booking', id: 'bk-1' },
      { kind: 'request', id: 'rq-1' },
      { kind: 'event_registration', id: 'er-1' },
      { kind: 'donation' },
      { kind: 'donation', purpose: 'Sponsorship' },
    ]
    for (const t of targets) expect(metadataToTarget(targetToMetadata(t))).toEqual(t)
  })

  it('does not invent a target from incomplete or old-style metadata', () => {
    expect(metadataToTarget({ targetKind: 'booking' })).toBeNull()
    expect(metadataToTarget({ category: 'Membership', membershipLevel: 'annual' })).toBeNull()
    expect(metadataToTarget(null)).toBeNull()
  })
})

describe('settleStripeIntent', () => {
  const intent = (over: Record<string, unknown> = {}) =>
    ({
      id: 'pi_1',
      status: 'succeeded',
      amount: 15100,
      amount_received: 15100,
      latest_charge: 'ch_1',
      metadata: { memberId: 'm-1', targetKind: 'membership', level: 'Annual' },
      ...over,
    }) as any

  const deps = () => {
    const db: any = {
      rpc: vi.fn(async () => ({
        data: [{ payment_id: 'p', receipt_id: 'r', receipt_number: 'RCP-2026-000001', already_settled: false }],
        error: null,
      })),
      from: () => {
        const q: any = { select: () => q, eq: () => q, update: () => q, single: async () => ({ data: { email_sent_at: 'x' }, error: null }) }
        return q
      },
    }
    return { db, send: vi.fn() }
  }

  it('records a succeeded payment once, keyed by the intent, for the amount Stripe received', async () => {
    const d = deps()
    const out = await settleStripeIntent(intent(), d)
    expect(out.state).toBe('paid')
    expect(d.db.rpc).toHaveBeenCalledWith(
      'settle_payment',
      expect.objectContaining({
        p_idempotency_key: 'stripe:pi_1',
        p_method: 'Stripe',
        p_amount: 151,
        p_level: 'Annual',
        p_stripe_payment_intent_id: 'pi_1',
        p_stripe_charge_id: 'ch_1',
      }),
    )
  })

  it('records nothing while Stripe is still processing, or after a failure', async () => {
    const d = deps()
    expect((await settleStripeIntent(intent({ status: 'processing' }), d)).state).toBe('processing')
    expect((await settleStripeIntent(intent({ status: 'requires_payment_method' }), d)).state).toBe('failed')
    expect(d.db.rpc).not.toHaveBeenCalled()
  })

  it('refuses a succeeded payment that does not say what it paid for', async () => {
    await expect(settleStripeIntent(intent({ metadata: { memberId: 'm-1' } }), deps())).rejects.toThrow(/does not say/)
  })
})
