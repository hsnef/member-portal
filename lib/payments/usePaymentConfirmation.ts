'use client'

import { useEffect, useState } from 'react'

/**
 * For a page Stripe returns to after a card payment. Asks the server what
 * happened to `paymentIntentId` (/api/stripe/confirm-payment), which records
 * the payment if it succeeded. The page only shows the answer; it never marks
 * anything paid itself.
 *
 * A payment Stripe is still processing is asked about again a few times
 * before the page says so.
 */

export type PaymentConfirmation =
  | { state: 'confirming' }
  | { state: 'paid'; receiptNumber: string; amount: number; targetKind: string | null; targetId: string | null }
  | { state: 'processing'; amount: number | null }
  | { state: 'failed' }
  | { state: 'error'; message: string }

const RETRIES = 4
const RETRY_MS = 2000

export function usePaymentConfirmation(paymentIntentId: string | null): PaymentConfirmation {
  const [result, setResult] = useState<PaymentConfirmation>({ state: 'confirming' })

  useEffect(() => {
    if (!paymentIntentId) {
      setResult({ state: 'error', message: 'This page was opened without a payment to confirm.' })
      return
    }
    let cancelled = false

    const ask = async (attempt: number) => {
      try {
        const res = await fetch('/api/stripe/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId }),
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setResult({ state: 'error', message: data.error || 'We could not confirm this payment.' })
        } else if (data.state === 'paid') {
          setResult({
            state: 'paid',
            receiptNumber: data.receiptNumber,
            amount: data.amount,
            targetKind: data.targetKind,
            targetId: data.targetId,
          })
        } else if (data.state === 'processing' && attempt < RETRIES) {
          setTimeout(() => ask(attempt + 1), RETRY_MS)
        } else if (data.state === 'processing') {
          setResult({ state: 'processing', amount: data.amount ?? null })
        } else {
          setResult({ state: 'failed' })
        }
      } catch {
        if (!cancelled) setResult({ state: 'error', message: 'We could not reach the portal to confirm this payment.' })
      }
    }

    ask(0)
    return () => {
      cancelled = true
    }
  }, [paymentIntentId])

  return result
}
