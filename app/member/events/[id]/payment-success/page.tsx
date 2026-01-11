'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Event {
  id: string
  event_name: string
  event_date: string
  event_time: string
  location: string
}

function PaymentSuccessContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const eventId = params.id as string
  const paymentIntent = searchParams.get('payment_intent')
  const { member } = useAuth()
  const supabase = createClient()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)

  useEffect(() => {
    if (!member || !eventId || !paymentIntent) return
    processPaymentAndRegister()
  }, [member, eventId, paymentIntent])

  const processPaymentAndRegister = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, event_name, event_date, event_time, location')
        .eq('id', eventId)
        .single()

      if (eventError || !eventData) {
        setError('Event not found')
        setLoading(false)
        return
      }

      setEvent(eventData)

      // Verify payment and create registration via API
      const response = await fetch('/api/events/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          paymentIntentId: paymentIntent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Already registered') {
          setRegistrationComplete(true)
        } else {
          setError(data.error || 'Failed to complete registration')
        }
        setLoading(false)
        return
      }

      setRegistrationComplete(true)
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred while processing your registration')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Processing your registration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Issue</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            If your payment was successful but registration failed, please contact the office with your payment confirmation.
          </p>
          <Link
            href="/member/events"
            className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] inline-block"
          >
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  if (!registrationComplete || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Unable to process registration</p>
          <Link
            href="/member/events"
            className="mt-4 px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] inline-block"
          >
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Registration Complete!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your payment was successful and you are now registered for the event.
          </p>

          {/* Event Details */}
          <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
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
            </div>
          </div>

          {/* Confirmation Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800">
              A confirmation email has been sent to your registered email address with your receipt and event details.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Link
              href="/member/events"
              className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] font-semibold"
            >
              View All Events
            </Link>
            <Link
              href="/member/dashboard"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Help Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Questions about your registration? Contact the temple office.</p>
        </div>
      </div>
    </div>
  )
}

export default function EventPaymentSuccessPage() {
  return (
    <ProtectedRoute>
      <PaymentSuccessContent />
    </ProtectedRoute>
  )
}
