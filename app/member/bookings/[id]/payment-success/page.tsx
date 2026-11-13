'use client'

import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { PaymentOutcomeView } from '@/components/member/PaymentOutcomeView'
import { CardPaymentOutcome } from '@/components/member/CardPaymentOutcome'
import { usePaymentConfirmation } from '@/lib/payments/usePaymentConfirmation'

/** Stripe returns here after a booking is paid by card. The server records it. */
function BookingPaymentSuccessContent() {
  const params = useParams()
  const search = useSearchParams()
  const bookingId = params.id as string
  const confirmation = usePaymentConfirmation(search.get('payment_intent'))

  return (
    <CardPaymentOutcome
      confirmation={confirmation}
      paidDescription="Your booking is paid and confirmed. The office will be in touch about the details."
      back={{ to: `/member/bookings/${bookingId}`, label: 'View my booking' }}
      retry={{ to: `/member/bookings/${bookingId}/payment`, label: 'Try again' }}
    />
  )
}

export default function BookingPaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentOutcomeView state="confirming" title="" description="" />}>
      <BookingPaymentSuccessContent />
    </Suspense>
  )
}
