'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLink } from '@/components/nav/Nav'
import { Button } from '@/components/ui/Button'
import { PaymentOutcomeView } from '@/components/member/PaymentOutcomeView'
import { formatCurrency } from '@/utils/format'

export default function BookingPaymentSuccessPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const bookingId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    verifyPaymentAndUpdateBooking()
  }, [])

  const verifyPaymentAndUpdateBooking = async () => {
    try {
      const paymentIntent = searchParams?.get('payment_intent')
      const paymentIntentClientSecret = searchParams?.get('payment_intent_client_secret')

      if (!paymentIntent) {
        setError('Payment verification failed: No payment intent found')
        return
      }

      // Fetch the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('service_bookings')
        .select('*, service_booking_items(*)')
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError

      // Check if booking is already marked as paid
      if (bookingData.status === 'Paid' || bookingData.status === 'Completed') {
        setBooking(bookingData)
        setLoading(false)
        return
      }

      // Verify payment with Stripe (via webhook, but we can also check here)
      const response = await fetch('/api/stripe/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntent }),
      })

      if (!response.ok) {
        throw new Error('Payment verification failed')
      }

      const paymentData = await response.json()

      if (paymentData.status === 'succeeded') {
        // Update booking status to Paid
        const { error: updateError } = await supabase
          .from('service_bookings')
          .update({
            status: 'Paid',
          })
          .eq('id', bookingId)

        if (updateError) throw updateError

        // Fetch updated booking
        const { data: updatedBooking } = await supabase
          .from('service_bookings')
          .select('*')
          .eq('id', bookingId)
          .single()

        setBooking(updatedBooking)
      } else {
        setError('Payment was not successful')
      }
    } catch (err: any) {
      console.error('Error verifying payment:', err)
      setError(err.message || 'Failed to verify payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PaymentOutcomeView
      state={loading ? 'confirming' : error ? 'error' : 'success'}
      confirmingLabel="Verifying your payment…"
      title={error ? 'We could not verify this payment' : 'Payment received — thank you'}
      description={
        error
          ? `${error}. If money left your account, do not pay again — contact the temple office and we will sort it out.`
          : 'Your booking is confirmed and marked as paid. A receipt is on its way to your email.'
      }
      facts={
        !error && booking
          ? [
              booking.booking_number && {
                label: 'Booking',
                value: String(booking.booking_number),
              },
              booking.total_amount != null && {
                label: 'Amount',
                value: formatCurrency(Number(booking.total_amount), true),
              },
              booking.status && { label: 'Status', value: String(booking.status) },
            ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>
          : undefined
      }
      actions={
        <>
          <AppLink to="/member/bookings">
            <Button size="lg">Back to my bookings</Button>
          </AppLink>
          {!error && (
            <AppLink to="/member/payments">
              <Button size="lg" variant="secondary">
                View payment history
              </Button>
            </AppLink>
          )}
        </>
      }
      footnote={error ? undefined : 'Receipts are always available under Payments.'}
    />
  )
}
