'use client'

/**
 * Shared checkout layout for every card-payment route:
 *   /member/bookings/[id]/payment
 *   /member/events/[id]/payment
 *   /member/requests/[id]/payment
 *
 * Presentation only. Each page keeps its own <Elements> provider, its
 * PaymentIntent creation and its stripe.confirmPayment() call, and passes the
 * PaymentElement in as `paymentElement`.
 *
 * Exemplar: design-kit/pages/Checkout.tsx
 */

import React from 'react'
import { CreditCardIcon, LockIcon, ShieldCheckIcon } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatCurrency } from '@/utils/format'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

/**
 * Stripe Elements appearance, so the card iframe matches the design system
 * instead of looking foreign. Shared by all three checkout routes.
 */
export const stripeAppearance = {
  theme: 'flat' as const,
  variables: {
    colorPrimary: '#c75b12',
    colorBackground: '#ffffff',
    colorText: '#2b2018',
    colorDanger: '#b23a2e',
    borderRadius: '13px',
    fontFamily: '"Instrument Sans", ui-sans-serif, system-ui, sans-serif',
    fontSizeBase: '16px',
    spacingUnit: '5px',
  },
}

export interface CheckoutViewProps {
  eyebrow?: string
  title: string
  description?: string
  /** Rows describing what is being paid for. */
  summaryItems: Array<{ label: string; value: React.ReactNode; numeric?: boolean }>
  /** Line items above the total. */
  lineItems?: Array<{ label: string; amount: number }>
  total: number
  /** Stripe's <PaymentElement />, supplied by the page. */
  paymentElement: React.ReactNode
  onSubmit: (event: React.FormEvent) => void
  submitting: boolean
  /** True until Stripe.js has loaded. */
  disabled?: boolean
  error?: string | null
  /** Reference the office desk can use for a manual payment. */
  reference?: string | null
  backHref: string
  backLabel: string
}

export function CheckoutView({
  eyebrow,
  title,
  description,
  summaryItems,
  lineItems,
  total,
  paymentElement,
  onSubmit,
  submitting,
  disabled = false,
  error,
  reference,
  backHref,
  backLabel,
}: CheckoutViewProps) {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={
          description ??
          'Your place is confirmed once this payment clears. A receipt is emailed immediately.'
        }
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Card details"
              description="Processed by Stripe. HSNEF never sees or stores your card number."
            />

            {error && (
              <div className="mb-5">
                <Alert tone="danger" title="That payment didn't go through">
                  {error}
                </Alert>
              </div>
            )}

            {paymentElement}

            <p className="mt-5 flex items-start gap-2.5 text-[13.5px] leading-snug text-ink-3">
              <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-tulsi" aria-hidden="true" />
              Encrypted end to end. HSNEF is a registered {TEMPLE_CONFIG.taxExemptStatus} —
              donations are tax deductible, service fees are not.
            </p>
          </Card>

          <Card tone="sunk">
            <CardHeader title="Prefer not to pay by card?" />
            <p className="text-[15px] leading-relaxed text-ink-2">
              You can pay by check or Zelle at the temple office.
              {reference ? (
                <>
                  {' '}Bring the reference{' '}
                  <span className="tnum font-semibold text-ink">{reference}</span> and the desk
                  will mark this paid.
                </>
              ) : (
                ' The desk can mark this paid for you.'
              )}
            </p>
          </Card>
        </div>

        {/* Order summary */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <Card spine="tulsi" className="pl-7">
            <CardHeader title="What you're paying for" />
            <DescriptionList items={summaryItems} />

            <dl className="mt-6 space-y-2.5 border-t border-line pt-4 text-[15px]">
              {lineItems?.map((item, i) => (
                <div key={`${item.label}-${i}`} className="flex justify-between gap-4">
                  <dt className="min-w-0 text-ink-2">{item.label}</dt>
                  <dd className="tnum shrink-0 text-ink">{formatCurrency(item.amount, true)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-serif text-[21px] text-ink">Total</dt>
                <dd className="tnum font-serif text-[30px] leading-none text-ink">
                  {formatCurrency(total, true)}
                </dd>
              </div>
            </dl>

            <Button
              type="submit"
              size="lg"
              fullWidth
              icon={CreditCardIcon}
              loading={submitting}
              disabled={disabled}
              className="mt-6"
            >
              Pay {formatCurrency(total, true)}
            </Button>

            <p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-ink-3">
              <ShieldCheckIcon className="h-4 w-4 text-tulsi" aria-hidden="true" />
              Secured by Stripe
            </p>
          </Card>

          <a href={backHref} className="block">
            <Button type="button" variant="ghost" fullWidth>
              {backLabel}
            </Button>
          </a>
        </div>
      </form>
    </div>
  )
}
