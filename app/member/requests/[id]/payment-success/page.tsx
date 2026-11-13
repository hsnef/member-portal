'use client'

import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { PaymentOutcomeView } from '@/components/member/PaymentOutcomeView'
import { CardPaymentOutcome } from '@/components/member/CardPaymentOutcome'
import { usePaymentConfirmation } from '@/lib/payments/usePaymentConfirmation'

/** Stripe returns here after a request (invoice) is paid by card. The server records it. */
function RequestPaymentSuccessContent() {
  const params = useParams()
  const search = useSearchParams()
  const requestId = params.id as string
  const confirmation = usePaymentConfirmation(search.get('payment_intent'))

  return (
    <CardPaymentOutcome
      confirmation={confirmation}
      paidDescription="Your request is paid. Thank you."
      back={{ to: '/member/requests', label: 'Back to my requests' }}
      retry={{ to: `/member/requests/${requestId}/payment`, label: 'Try again' }}
    />
  )
}

export default function RequestPaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentOutcomeView state="confirming" title="" description="" />}>
      <RequestPaymentSuccessContent />
    </Suspense>
  )
}
