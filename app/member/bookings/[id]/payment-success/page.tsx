'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'

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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Verifying payment...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Payment Verification Error</h2>
              <p className="text-red-700">{error}</p>
              <p className="text-sm text-red-600 mt-2">
                If you were charged, please contact us. Your payment ID: {searchParams?.get('payment_intent')}
              </p>
              <button
                onClick={() => router.push('/member/bookings')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Back to Bookings
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Success Message */}
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your service booking payment has been processed successfully.
            </p>

            {booking && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Booking Details</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>
                    <strong>Booking ID:</strong> #{booking.id.slice(0, 8)}
                  </p>
                  <p>
                    <strong>Amount Paid:</strong> ${booking.total_amount.toFixed(2)}
                  </p>
                  <p>
                    <strong>Status:</strong> {booking.status}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                ✓ A receipt has been sent to your email address
              </p>
              <p className="text-sm text-green-800">
                ✓ Your services will be performed as scheduled
              </p>
              <p className="text-sm text-green-800">
                ✓ You will receive reminders before each service date
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push(`/member/bookings/${bookingId}`)}
                className="px-6 py-3 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold"
              >
                View Booking Details
              </button>
              <button
                onClick={() => router.push('/member/bookings')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold"
              >
                View All Bookings
              </button>
            </div>
          </div>

          {/* What's Next */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-saffron mt-0.5">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3">
                  <strong>Confirmation:</strong> You'll receive a confirmation email with all booking details and receipt.
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-saffron mt-0.5">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3">
                  <strong>Reminders:</strong> We'll send you reminders via email and SMS before each service date.
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-saffron mt-0.5">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3">
                  <strong>Questions?</strong> Contact us at the temple office if you need to make any changes to your booking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
