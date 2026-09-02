'use client'

/**
 * Donate — presentation only.
 *
 * app/member/donate/page.tsx owns the PaymentIntent lifecycle, the Zelle
 * request creation/confirmation, and every API call. This file renders the
 * amount picker, the purpose select and whichever payment surface the page
 * hands it.
 *
 * Exemplar: design-kit/pages/Donate.tsx (payment-form archetype)
 */

import React from 'react'
import { CreditCardIcon, HeartHandshakeIcon, LockIcon, ShieldCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

export const SUGGESTED_DONATIONS = [25, 51, 101, 251, 501, 1001]

export const DONATION_PURPOSES: Array<{ value: string; label: string }> = [
  { value: 'General', label: 'General Temple Fund' },
  { value: 'Building', label: 'Building & Maintenance' },
  { value: 'Festival', label: 'Festival Sponsorship' },
  { value: 'Education', label: 'Education Programs' },
  { value: 'Annadanam', label: 'Annadanam (Food Service)' },
  { value: 'Priest', label: 'Priest Support' },
  { value: 'Other', label: 'Other' },
]

export type DonatePaymentMethod = 'card' | 'zelle'

export interface DonateViewProps {
  amount: number
  onAmountChange: (amount: number) => void
  purpose: string
  onPurposeChange: (purpose: string) => void
  paymentMethod: DonatePaymentMethod
  onPaymentMethodChange: (method: DonatePaymentMethod) => void
  /** Rendered when the method is 'zelle' — the option tile from the page. */
  zelleOption?: React.ReactNode
  /** Rendered when the method is 'zelle' — instructions / QR / confirm form. */
  zelleSurface?: React.ReactNode
  /** Rendered when the method is 'card' — Stripe's <PaymentElement /> + submit. */
  cardSurface?: React.ReactNode
  /** True while a PaymentIntent is being (re)created. */
  updating?: boolean
  error?: string | null
}

export function DonateView({
  amount,
  onAmountChange,
  purpose,
  onPurposeChange,
  paymentMethod,
  onPaymentMethodChange,
  zelleOption,
  zelleSurface,
  cardSurface,
  updating,
  error,
}: DonateViewProps) {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Support the temple"
        title="Make a donation"
        description="Every contribution supports daily worship, festivals and the community the temple serves."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          {/* ---- Amount ---- */}
          <Card>
            <CardHeader
              title="Choose an amount"
              description="Suggested amounts follow the tradition of ending in one."
            />

            <div className="grid grid-cols-3 gap-3">
              {SUGGESTED_DONATIONS.map((preset) => {
                const selected = amount === preset
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onAmountChange(preset)}
                    className={cn(
                      'tnum rounded-2xl border px-3 py-4 text-[19px] font-semibold transition-all duration-200 ease-smooth',
                      selected
                        ? 'border-saffron bg-saffron text-white shadow-glow'
                        : 'border-line-strong bg-surface text-ink hover:border-saffron-ring hover:bg-saffron-soft'
                    )}
                  >
                    {formatCurrency(preset)}
                  </button>
                )
              })}
            </div>

            <div className="mt-5">
              <Field label="Or enter your own amount" hint="Minimum $1.">
                {({ id }) => (
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] font-semibold text-ink-3"
                    >
                      $
                    </span>
                    <Input
                      id={id}
                      type="number"
                      min={1}
                      step="1"
                      inputMode="decimal"
                      className="tnum pl-9"
                      placeholder="0.00"
                      value={amount || ''}
                      onChange={(e) => {
                        const next = Number(e.target.value)
                        if (!Number.isNaN(next)) onAmountChange(next)
                      }}
                    />
                  </div>
                )}
              </Field>
            </div>

            <div className="mt-5">
              <Field label="What is it for?">
                {({ id }) => (
                  <Select
                    id={id}
                    value={purpose}
                    onChange={(e) => onPurposeChange(e.target.value)}
                  >
                    {DONATION_PURPOSES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </Card>

          {/* ---- Payment method ---- */}
          <Card>
            <CardHeader title="How would you like to pay?" />

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={paymentMethod === 'card'}
                onClick={() => onPaymentMethodChange('card')}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ease-smooth',
                  paymentMethod === 'card'
                    ? 'border-saffron bg-saffron-soft'
                    : 'border-line-strong bg-surface hover:border-saffron-ring'
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-t-full rounded-b-lg bg-saffron-soft text-saffron ring-1 ring-inset ring-saffron-ring">
                  <CreditCardIcon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-ink">
                    Credit or debit card
                  </span>
                  <span className="mt-0.5 block text-[13px] text-ink-3">Instant, via Stripe</span>
                </span>
              </button>

              {zelleOption}
            </div>
          </Card>

          {error && (
            <Alert tone="danger" title="That didn't go through">
              {error}
            </Alert>
          )}

          {/* ---- The payment surface ---- */}
          {paymentMethod === 'card' ? cardSurface : zelleSurface}
        </div>

        {/* ---- Summary rail ---- */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <Card spine="tulsi" className="pl-7">
            <CardHeader title="Your donation" />
            <dl className="space-y-2.5 text-[15px]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">Fund</dt>
                <dd className="text-right font-semibold text-ink">
                  {DONATION_PURPOSES.find((p) => p.value === purpose)?.label ?? purpose}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-serif text-[21px] text-ink">Total</dt>
                <dd className="tnum font-serif text-[30px] leading-none text-ink">
                  {formatCurrency(amount, true)}
                </dd>
              </div>
            </dl>

            {updating && (
              <p className="mt-3 text-[13px] text-ink-3">Updating your payment…</p>
            )}

            <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-tulsi-soft p-4">
              <HeartHandshakeIcon
                className="mt-0.5 h-5 w-5 shrink-0 text-tulsi"
                aria-hidden="true"
              />
              <p className="text-[13.5px] leading-relaxed text-ink-2">
                HSNEF is a registered {TEMPLE_CONFIG.taxExemptStatus}. Your donation is tax
                deductible and a receipt is emailed immediately.
              </p>
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-ink-3">
              {paymentMethod === 'card' ? (
                <>
                  <ShieldCheckIcon className="h-4 w-4 text-tulsi" aria-hidden="true" />
                  Secured by Stripe
                </>
              ) : (
                <>
                  <LockIcon className="h-4 w-4 text-tulsi" aria-hidden="true" />
                  Paid directly from your bank
                </>
              )}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
