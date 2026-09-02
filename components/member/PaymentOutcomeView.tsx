'use client'

/**
 * Shared outcome screen for every post-Stripe return route:
 *   /member/payment-success
 *   /member/bookings/[id]/payment-success
 *   /member/events/[id]/payment-success
 *   /member/requests/[id]/payment-success
 *
 * Presentation only. Each page owns its own confirmation call
 * (/api/stripe/confirm-payment, /api/stripe/verify-payment,
 * /api/events/confirm-payment) and passes the outcome in.
 *
 * Exemplar: design-kit/pages/PaymentSuccess.tsx
 */

import React from 'react'
import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react'
import { StatusScreen } from '@/components/ui/StatusScreen'
import { Alert } from '@/components/ui/Alert'

export interface PaymentOutcomeViewProps {
  /** 'confirming' while the verification call is in flight. */
  state: 'confirming' | 'success' | 'error'
  title: string
  description: string
  /** Key/value block — amount, reference, date and so on. */
  facts?: Array<{ label: string; value: React.ReactNode }>
  actions?: React.ReactNode
  footnote?: React.ReactNode
  /**
   * Non-fatal note shown above a SUCCESS screen: the money was taken but
   * recording it lagged. Distinct from `state="error"`, which means the
   * verification itself failed.
   */
  warning?: string | null
  /** Copy for the confirming state. */
  confirmingLabel?: string
}

export function PaymentOutcomeView({
  state,
  title,
  description,
  facts,
  actions,
  footnote,
  warning,
  confirmingLabel = 'Confirming your payment…',
}: PaymentOutcomeViewProps) {
  if (state === 'confirming') {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center text-center"
        role="status"
        aria-live="polite"
      >
        <Loader2Icon
          className="h-10 w-10 animate-spin text-saffron"
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <h1 className="mt-6 font-serif text-[28px] leading-tight text-ink">{confirmingLabel}</h1>
        <p className="mt-2 text-[15.5px] text-ink-2">
          Please don&apos;t close this tab — this only takes a moment.
        </p>
      </div>
    )
  }

  return (
    <>
      {state === 'success' && warning && (
        <div className="mx-auto mb-6 max-w-xl">
          <Alert tone="warning" title="Your payment went through">
            {warning} It may take a few minutes to appear in your history.
          </Alert>
        </div>
      )}
      <StatusScreen
        icon={state === 'success' ? CheckCircle2Icon : AlertTriangleIcon}
        tone={state === 'success' ? 'tulsi' : 'danger'}
        eyebrow={state === 'success' ? 'Payment received' : 'Needs attention'}
        title={title}
        description={description}
        facts={facts}
        actions={actions}
        footnote={footnote}
      />
    </>
  )
}
