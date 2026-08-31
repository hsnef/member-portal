'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface Event {
  id: string
  event_name: string
  event_date: string
  event_time: string
  location: string
  description: string
  category: string
  member_price: number
  non_member_price: number
  image_url?: string
}

function PaymentForm({ event, amount }: { event: Event; amount: number }) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { member } = useAuth()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !member) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/member/events/${event.id}/payment-success`,
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

  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Event</p>
            <p className="text-lg font-semibold text-gray-900">{event.event_name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{eventDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-medium text-gray-900">{event.event_time}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium text-gray-900">{event.location}</p>
          </div>
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-gray-900">Amount Due</p>
              <p className="text-2xl font-bold text-saffron">${amount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
        <PaymentElement />
      </div>

      {message && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{message}</p>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.push('/member/events')}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}

function EventPaymentContent() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const { member } = useAuth()
  const supabase = createClient()

  const [event, setEvent] = useState<Event | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate price based on membership level
  const getPrice = (event: Event): number => {
    if (!member) return event.non_member_price
    const isMember = member.current_level === 'Annual' || member.current_level === 'Lifetime'
    return isMember ? event.member_price : event.non_member_price
  }

  useEffect(() => {
    if (!member || !eventId) return
    fetchEventAndCreatePayment()
  }, [member, eventId])

  const fetchEventAndCreatePayment = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError || !eventData) {
        setError('Event not found')
        setLoading(false)
        return
      }

      setEvent(eventData)

      // Check if already registered
      const { data: existingReg } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('member_id', member!.id)
        .single()

      if (existingReg) {
        setError('You are already registered for this event')
        setLoading(false)
        return
      }

      const price = getPrice(eventData)

      // If event is free, redirect to direct registration
      if (price <= 0) {
        router.push('/member/events')
        return
      }

      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(price * 100), // Convert to cents
          memberId: member!.id,
          category: 'Event',
          description: `Event Registration - ${eventData.event_name}`,
          metadata: {
            eventId: eventId,
            eventName: eventData.event_name,
          },
        }),
      })

      const data = await response.json()
      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
      } else {
        setError('Failed to initialize payment')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred while loading the payment form')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading payment form...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Process Payment</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/member/events')}
            className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
          >
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  if (!event || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Unable to load payment form</p>
          <button
            onClick={() => router.push('/member/events')}
            className="mt-4 px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
          >
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  const amount = getPrice(event)

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#c75b12',
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/member/events')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Events
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Event Registration</h1>
          <p className="mt-2 text-gray-600">
            Complete your payment to register for this event
          </p>
        </div>

        {/* Payment Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm event={event} amount={amount} />
          </Elements>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Secure payment powered by Stripe</p>
          <p className="mt-1">Your payment information is encrypted and secure</p>
        </div>
      </div>
    </div>
  )
}

export default function EventPaymentPage() {
  return (
    <ProtectedRoute>
      <EventPaymentContent />
    </ProtectedRoute>
  )
}
