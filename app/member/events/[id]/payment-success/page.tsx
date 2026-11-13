'use client'

import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { PaymentOutcomeView } from '@/components/member/PaymentOutcomeView'
import { CardPaymentOutcome } from '@/components/member/CardPaymentOutcome'
import { usePaymentConfirmation } from '@/lib/payments/usePaymentConfirmation'

/** Stripe returns here after an event registration is paid by card. The server records it. */
function EventPaymentSuccessContent() {
  const params = useParams()
  const search = useSearchParams()
  const eventId = params.id as string
  const confirmation = usePaymentConfirmation(search.get('payment_intent'))

  return (
    <CardPaymentOutcome
      confirmation={confirmation}
      paidDescription="You are registered for this event. We look forward to seeing you."
      back={{ to: `/member/events/${eventId}`, label: 'View the event' }}
      retry={{ to: `/member/events/${eventId}/payment`, label: 'Try again' }}
    />
  )
}

export default function EventPaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentOutcomeView state="confirming" title="" description="" />}>
      <EventPaymentSuccessContent />
    </Suspense>
  )
}
