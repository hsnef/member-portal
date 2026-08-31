'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface BookingItem {
  id: string
  services: {
    name: string
  }
  service_date: string
  service_time: string
  price: number
}

interface Booking {
  id: string
  requester_name: string
  total_amount: number
  status: string
  service_booking_items: BookingItem[]
}

function PaymentForm({ booking }: { booking: Booking }) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { member } = useAuth()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/member/bookings/${booking.id}/payment-success`,
        },
      })

      if (error) {
        setMessage(error.message || 'An error occurred')
      }
    } catch (err) {
      setMessage('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Booking Summary</h3>
        <div className="space-y-2 text-sm text-blue-800">
          {booking.service_booking_items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.services.name} - {new Date(item.service_date).toLocaleDateString()}
              </span>
              <span className="font-medium">${item.price.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-bold">
            <span>Total Amount</span>
            <span>${booking.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
        <PaymentElement />
      </div>

      {/* Receipt Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Receipt</h3>
            <p className="mt-1 text-sm text-green-700">
              A receipt will be emailed to you upon successful payment confirmation.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{message}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push(`/member/bookings/${booking.id}`)}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-transparent font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-6 py-3 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Processing...' : `Pay $${booking.total_amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}

export default function BookingPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const supabase = createClient()
  const { member } = useAuth()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (bookingId && member) {
      fetchBookingAndCreatePaymentIntent()
    }
  }, [bookingId, member])

  const fetchBookingAndCreatePaymentIntent = async () => {
    try {
      setLoading(true)

      // Fetch booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('service_bookings')
        .select(`
          *,
          service_booking_items (
            *,
            services (name)
          )
        `)
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError

      // Verify booking is approved
      if (bookingData.status !== 'Approved') {
        setError('This booking is not approved for payment')
        return
      }

      setBooking(bookingData)

      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(bookingData.total_amount * 100), // Convert dollars to cents
          memberId: member?.id,
          category: 'Service',
          description: `Service Booking #${bookingData.id.slice(0, 8)}`,
          metadata: {
            bookingId: bookingData.id,
            requesterName: bookingData.requester_name,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret: secret } = await response.json()
      setClientSecret(secret)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to load payment form')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="bg-transparent flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading payment form...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="bg-transparent py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Payment Error</h2>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => router.push(`/member/bookings/${bookingId}`)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Back to Booking
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!booking || !clientSecret) {
    return (
      <>
        <div className="bg-transparent flex items-center justify-center">
          <p className="text-gray-600">Booking not found</p>
        </div>
      </>
    )
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#c75b12',
    },
  }

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <>
      <div className="bg-transparent py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <button
              onClick={() => router.push(`/member/bookings/${bookingId}`)}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to Booking
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
            <p className="mt-1 text-sm text-gray-600">
              Complete payment for Booking #{booking.id.slice(0, 8)}
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <Elements stripe={stripePromise} options={options}>
              <PaymentForm booking={booking} />
            </Elements>
          </div>
        </div>
      </div>
    </>
  )
}
