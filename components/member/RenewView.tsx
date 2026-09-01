'use client'

/**
 * Membership renewal / upgrade — presentation only.
 *
 * app/member/renew/page.tsx owns the pricing fetch, the PaymentIntent
 * lifecycle and its re-creation when the level changes.
 *
 * Exemplar: design-kit/pages/Membership.tsx (tier picker + summary rail),
 * then Checkout.tsx for the payment half.
 */

import React from 'react'
import { CheckIcon, ShieldCheckIcon, SparklesIcon } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'
import type { MembershipPricing } from '@/lib/utils/portalSettings'

export type RenewLevel = 'annual' | 'lifetime'

const LEVEL_LABEL: Record<RenewLevel, string> = {
  annual: 'Annual',
  lifetime: 'Lifetime',
}

const LEVEL_PERKS: Record<RenewLevel, string[]> = {
  annual: [
    'Member pricing on every puja and service',
    'Festival and event member rates',
    'A vote at the general body meeting',
  ],
  lifetime: [
    'Everything in Annual, permanently',
    'Never renew again',
    'Recognised as a lifetime supporter of the temple',
  ],
}

export interface RenewViewProps {
  pricing: MembershipPricing
  selectedLevel: RenewLevel
  onLevelChange: (level: RenewLevel) => void
  /** Current level, so we can say "upgrade" rather than "renew" where apt. */
  currentLevel?: string | null
  updating?: boolean
  /** Stripe surface supplied by the page. */
  paymentSurface: React.ReactNode
}

export function RenewView({
  pricing,
  selectedLevel,
  onLevelChange,
  currentLevel,
  updating,
  paymentSurface,
}: RenewViewProps) {
  const isUpgrade = currentLevel === 'Community'
  const amount = pricing[selectedLevel].price

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Your membership"
        title={isUpgrade ? 'Upgrade your membership' : 'Renew your membership'}
        description={
          isUpgrade
            ? 'Move to a full membership for member pricing across every service the temple offers.'
            : 'Keep member pricing on pujas, festivals and events for the year ahead.'
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Choose your level" />

            <div className="grid gap-4 sm:grid-cols-2">
              {(['annual', 'lifetime'] as RenewLevel[]).map((level) => {
                const selected = selectedLevel === level
                const tier = pricing[level]
                return (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onLevelChange(level)}
                    className={cn(
                      'relative rounded-2xl border p-5 text-left transition-all duration-200 ease-smooth',
                      selected
                        ? 'border-saffron bg-saffron-soft shadow-glow'
                        : 'border-line-strong bg-surface hover:border-saffron-ring hover:bg-saffron-soft/40'
                    )}
                  >
                    {level === 'lifetime' && (
                      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-marigold px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-[0.08em] text-kumkum">
                        <SparklesIcon className="h-3 w-3" aria-hidden="true" />
                        Best value
                      </span>
                    )}

                    <p className="font-serif text-[26px] leading-none text-ink">
                      {LEVEL_LABEL[level]}
                    </p>
                    <p className="tnum mt-2 font-serif text-[34px] leading-none text-ink">
                      {tier.displayPrice || formatCurrency(tier.price)}
                    </p>
                    {tier.description && (
                      <p className="mt-2 text-[14px] leading-snug text-ink-2">
                        {tier.description}
                      </p>
                    )}

                    <ul className="mt-4 space-y-1.5">
                      {LEVEL_PERKS[level].map((perk) => (
                        <li key={perk} className="flex items-start gap-2 text-[13.5px] text-ink-2">
                          <CheckIcon
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tulsi"
                            aria-hidden="true"
                          />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
          </Card>

          {paymentSurface}
        </div>

        {/* Summary rail */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <Card spine="kumkum" className="pl-7">
            <CardHeader title="Your membership" />
            <dl className="space-y-2.5 text-[15px]">
              {currentLevel && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Current</dt>
                  <dd className="font-semibold text-ink">{currentLevel}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">{isUpgrade ? 'Upgrading to' : 'Renewing as'}</dt>
                <dd className="font-semibold text-ink">{LEVEL_LABEL[selectedLevel]}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-serif text-[21px] text-ink">Total</dt>
                <dd className="tnum font-serif text-[30px] leading-none text-ink">
                  {formatCurrency(amount, true)}
                </dd>
              </div>
            </dl>

            {updating && <p className="mt-3 text-[13px] text-ink-3">Updating your payment…</p>}

            <p className="mt-6 flex items-center justify-center gap-2 text-[13px] text-ink-3">
              <ShieldCheckIcon className="h-4 w-4 text-tulsi" aria-hidden="true" />
              Secured by Stripe
            </p>
          </Card>

          <Card tone="sunk">
            <p className="text-[14px] leading-relaxed text-ink-2">
              Prefer to pay by check or Zelle? The temple office can take your renewal in person —
              call{' '}
              <a
                href={`tel:${TEMPLE_CONFIG.contact.phone.replace(/[^0-9+]/g, '')}`}
                className="tnum font-semibold text-saffron hover:text-saffron-hover"
              >
                {TEMPLE_CONFIG.contact.phone}
              </a>
              .
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
