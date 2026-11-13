'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PaymentOutcomeView } from '@/components/member/PaymentOutcomeView'
import { CardPaymentOutcome } from '@/components/member/CardPaymentOutcome'
import { usePaymentConfirmation } from '@/lib/payments/usePaymentConfirmation'

/** Stripe returns here after a membership or donation card payment. */
function PaymentSuccessContent() {
  const params = useSearchParams()
  const confirmation = usePaymentConfirmation(params.get('payment_intent'))
  const isMembership = confirmation.state === 'paid' && confirmation.targetKind === 'membership'

  return (
    <CardPaymentOutcome
      confirmation={confirmation}
      paidDescription={
        isMembership
          ? 'Your membership is active. Your membership pass shows your new level and its dates.'
          : 'Thank you for your generous support of the temple.'
      }
      back={isMembership ? { to: '/member/pass', label: 'View my membership pass' } : { to: '/member', label: 'Back to my portal' }}
      retry={{ to: '/member', label: 'Back to my portal' }}
    />
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentOutcomeView state="confirming" title="" description="" />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
