'use client'

/**
 * What every page Stripe returns to shows, from the server's answer
 * (usePaymentConfirmation). Pages supply only their own wording and where
 * "back" goes; whether the payment was recorded is decided on the server.
 */

import React from 'react'
import { AppLink } from '@/components/nav/Nav'
import { Button } from '@/components/ui/Button'
import { PaymentOutcomeView } from '@/components/member/PaymentOutcomeView'
import { formatCurrency } from '@/utils/format'
import type { PaymentConfirmation } from '@/lib/payments/usePaymentConfirmation'

export interface CardPaymentOutcomeProps {
  confirmation: PaymentConfirmation
  /** Shown once the payment is recorded. */
  paidDescription: string
  /** Extra facts for a recorded payment (booking number, membership level...). */
  facts?: Array<{ label: string; value: React.ReactNode }>
  /** Where the main button goes, and what it says. */
  back: { to: string; label: string }
  /** Where to try again after a failed payment. */
  retry?: { to: string; label: string }
}

export function CardPaymentOutcome({ confirmation, paidDescription, facts = [], back, retry }: CardPaymentOutcomeProps) {
  const backButton = (
    <AppLink to={back.to}>
      <Button size="lg">{back.label}</Button>
    </AppLink>
  )
  const history = (
    <AppLink to="/member/payments">
      <Button size="lg" variant="secondary">
        Payment history
      </Button>
    </AppLink>
  )

  switch (confirmation.state) {
    case 'confirming':
      return <PaymentOutcomeView state="confirming" title="" description="" />

    case 'paid':
      return (
        <PaymentOutcomeView
          state="success"
          title="Thank you, your payment is complete"
          description={paidDescription}
          facts={[
            { label: 'Amount', value: formatCurrency(confirmation.amount, true) },
            { label: 'Receipt', value: confirmation.receiptNumber },
            ...facts,
          ]}
          actions={
            <>
              {backButton}
              {history}
            </>
          }
          footnote="Your receipt has been emailed to you, and it is always available under Payments."
        />
      )

    case 'processing':
      return (
        <PaymentOutcomeView
          state="success"
          eyebrow="Processing"
          title="Your payment is being processed"
          description="Your bank is still confirming this payment. You do not need to pay again: we will email your receipt as soon as it clears."
          facts={confirmation.amount ? [{ label: 'Amount', value: formatCurrency(confirmation.amount, true) }] : undefined}
          actions={
            <>
              {backButton}
              {history}
            </>
          }
        />
      )

    case 'failed':
      return (
        <PaymentOutcomeView
          state="error"
          title="The payment did not go through"
          description="Your card was not charged. You can try again, or choose another way to pay."
          actions={
            <>
              {retry && (
                <AppLink to={retry.to}>
                  <Button size="lg">{retry.label}</Button>
                </AppLink>
              )}
              <AppLink to={back.to}>
                <Button size="lg" variant="secondary">
                  {back.label}
                </Button>
              </AppLink>
            </>
          }
        />
      )

    case 'error':
      return (
        <PaymentOutcomeView
          state="error"
          title="We could not confirm this payment yet"
          description={`${confirmation.message} If your card was charged, the payment will still be recorded and your receipt emailed; please check Payments in a few minutes, or contact the office.`}
          actions={
            <>
              {history}
              {backButton}
            </>
          }
        />
      )
  }
}
