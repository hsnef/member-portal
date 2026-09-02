'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CheckoutView, stripeAppearance } from '@/components/member/CheckoutView'
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

  const items = booking.service_booking_items ?? []

  return (
    <CheckoutView
      eyebrow={`Booking #${booking.id.slice(0, 8)}`}
      title="Complete your payment"
      description="Your booking is confirmed once this payment clears. A receipt is emailed immediately."
      summaryItems={items.map((item) => ({
        label: item.services.name,
        value: new Date(item.service_date).toLocaleDateString(),
        numeric: true,
      }))}
      lineItems={items.map((item) => ({
        label: item.services.name,
        amount: Number(item.price),
      }))}
      total={Number(booking.total_amount)}
      paymentElement={<PaymentElement />}
      onSubmit={handleSubmit}
      submitting={loading}
      disabled={!stripe}
      error={message}
      reference={booking.id.slice(0, 8).toUpperCase()}
      backHref={`/member/bookings/${booking.id}`}
      backLabel="Back to this booking"
    />
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

  const options = {
    clientSecret,
    appearance: stripeAppearance,
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm booking={booking} />
    </Elements>
  )
}
