'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { AppLink } from '@/components/nav/Nav'
import { Button } from '@/components/ui/Button'
import { PaymentOutcomeView } from '@/components/member/PaymentOutcomeView'
import { formatLongDate } from '@/utils/format'

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

  const failed = Boolean(error) || !registrationComplete || !event

  return (
    <PaymentOutcomeView
      state={loading ? 'confirming' : failed ? 'error' : 'success'}
      confirmingLabel="Completing your registration…"
      title={failed ? 'We could not complete your registration' : "You're registered"}
      description={
        failed
          ? `${error ?? 'Unable to process registration.'} If your payment went through but the registration did not, contact the temple office with your confirmation and we will finish it for you.`
          : `Your place at ${event!.event_name} is confirmed. A confirmation email is on its way.`
      }
      facts={
        !failed && event
          ? [
              { label: 'Event', value: event.event_name },
              { label: 'Date', value: formatLongDate(event.event_date) },
              { label: 'Time', value: event.event_time },
              { label: 'Location', value: event.location },
            ]
          : undefined
      }
      actions={
        <>
          <AppLink to="/member/events">
            <Button size="lg">Back to events</Button>
          </AppLink>
          {!failed && (
            <AppLink to="/member/payments">
              <Button size="lg" variant="secondary">
                View payment history
              </Button>
            </AppLink>
          )}
        </>
      }
      footnote={failed ? undefined : 'Your receipt will be available under Payments.'}
    />
  )
}

export default function EventPaymentSuccessPage() {
  return (
    <>
      <PaymentSuccessContent />
    </>
  )
}
