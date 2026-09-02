'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { EventDetailView, type EventDetail } from '@/components/member/EventDetailView'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { CalendarXIcon } from 'lucide-react'
import Link from 'next/link'

function EventDetailContent() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const { member } = useAuth()
  const supabase = createClient()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!member || !eventId) return
    fetchEvent()
  }, [member, eventId])

  const fetchEvent = async () => {
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

      // Get registration count
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)

      // Check if current member is registered
      const { data: userReg } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('member_id', member!.id)
        .single()

      setEvent({
        ...eventData,
        registration_count: count || 0,
        is_registered: !!userReg,
      })
    } catch (err) {
      console.error('Error fetching event:', err)
      setError('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const getEventPrice = (): number => {
    if (!event || !member) return 0
    const isMember = member.current_level === 'Annual' || member.current_level === 'Lifetime'
    return isMember ? event.member_price : event.non_member_price
  }

  const handleRegister = async () => {
    if (!member || !event) return

    // Check if RSVP is enabled
    if (!event.rsvp_enabled) {
      alert('Registration is not available for this event.')
      return
    }

    // If event is payable, redirect to payment page
    if (event.is_payable) {
      router.push(`/member/events/${eventId}/payment`)
      return
    }

    // Free event - register directly
    setRegistering(true)
    try {
      const response = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register')
      }

      alert('Successfully registered! A confirmation email has been sent.')
      fetchEvent()
    } catch (error: any) {
      console.error('Error registering for event:', error)
      alert(error.message || 'Failed to register for event')
    } finally {
      setRegistering(false)
    }
  }

  const handleUnregister = async () => {
    if (!member || !event) return

    setCancelling(true)
    try {
      const response = await fetch('/api/events/unregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel registration')
      }

      setCancelConfirm(false)
      fetchEvent()
    } catch (error: any) {
      console.error('Error cancelling registration:', error)
      alert(error.message || 'Failed to cancel registration')
    } finally {
      setCancelling(false)
    }
  }

  const isEventFull = () => {
    if (!event) return false
    return event.max_capacity > 0 && (event.registration_count || 0) >= event.max_capacity
  }

  const isRegistrationClosed = () => {
    if (!event) return true
    if (event.registration_deadline) {
      return new Date(event.registration_deadline) < new Date()
    }
    return new Date(event.event_date) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading this event…</span>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <EmptyState
        icon={CalendarXIcon}
        title="Event not found"
        description={error ?? 'This event may have been unpublished or removed.'}
        action={
          <AppLink to="/member/events">
            <Button>Back to events</Button>
          </AppLink>
        }
      />
    )
  }

  return (
    <EventDetailView
      event={event}
      price={getEventPrice()}
      full={isEventFull()}
      registrationClosed={isRegistrationClosed()}
      registering={registering}
      onRegister={handleRegister}
      cancelConfirm={cancelConfirm}
      onRequestCancel={setCancelConfirm}
      onUnregister={handleUnregister}
      cancelling={cancelling}
    />
  )
}

export default function EventDetailPage() {
  return (
    <>
      <EventDetailContent />
    </>
  )
}
