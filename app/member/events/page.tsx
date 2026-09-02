'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getTestAuthUserIds, isTestIsolationMode } from '@/lib/utils/testDataFiltering'
import { EventsView, type MemberEvent } from '@/components/member/EventsView'
import { NoMembershipState } from '@/components/member/NoMembershipState'

export default function MemberEventsPage() {
  const router = useRouter()
  const { member } = useAuth()
  const supabase = createClient()

  const [events, setEvents] = useState<MemberEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('All')
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!member) return
    fetchEvents()
  }, [member])

  const fetchEvents = async () => {
    if (!member) return

    try {
      // CRITICAL: Check if current user is a test account
      const isTestUser = await isTestIsolationMode()
      const testAuthUserIds = await getTestAuthUserIds()

      // Fetch published upcoming events
      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'Published')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })

      // ISOLATION LOGIC:
      // - Test users: Show ONLY test-created events (sandbox)
      // - Regular members: Show ONLY production events (hide test events)
      if (isTestUser) {
        // Test user: Show ONLY test events
        if (testAuthUserIds.length > 0) {
          query = query.in('created_by', testAuthUserIds)
        } else {
          // No test events exist, show nothing
          setEvents([])
          return
        }
      } else {
        // Regular member: Filter out test-created events
        if (testAuthUserIds.length > 0) {
          query = query.not('created_by', 'in', `(${testAuthUserIds.join(',')})`)
        }
      }

      const { data: eventsData, error: eventsError } = await query

      if (eventsError) throw eventsError

      // Get registration counts and user's registrations
      const eventsWithDetails = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get total registration count
          const { count } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)

          // Check if current member is registered
          const { data: userReg } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('event_id', event.id)
            .eq('member_id', member.id)
            .single()

          return {
            ...event,
            registration_count: count || 0,
            is_registered: !!userReg,
          }
        })
      )

      setEvents(eventsWithDetails)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate price based on membership level
  const getEventPrice = (event: MemberEvent): number => {
    if (!member) return event.non_member_price
    const isMember = member.current_level === 'Annual' || member.current_level === 'Lifetime'
    return isMember ? event.member_price : event.non_member_price
  }

  const handleRegister = async (eventId: string) => {
    if (!member) return

    // Find the event to check if it's paid
    const event = events.find(e => e.id === eventId)
    if (!event) return

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
      fetchEvents() // Refresh to update registration status
    } catch (error: any) {
      console.error('Error registering for event:', error)
      alert(error.message || 'Failed to register for event')
    }
  }

  const handleUnregister = async (eventId: string) => {
    if (!member) return

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

      setCancelConfirmId(null)
      fetchEvents()
    } catch (error: any) {
      console.error('Error cancelling registration:', error)
      alert(error.message || 'Failed to cancel registration')
    } finally {
      setCancelling(false)
    }
  }

  const filteredEvents = events.filter((event) => {
    return filterCategory === 'All' || event.category === filterCategory
  })

  const isEventFull = (event: MemberEvent) => {
    return event.max_capacity > 0 && (event.registration_count || 0) >= event.max_capacity
  }

  const isRegistrationClosed = (event: MemberEvent) => {
    if (event.registration_deadline) {
      return new Date(event.registration_deadline) < new Date()
    }
    return new Date(event.event_date) < new Date()
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Festival': return '🎉'
      case 'Puja': return '🙏'
      case 'Educational': return '📚'
      case 'Social': return '👥'
      case 'Cultural': return '🎭'
      case 'Fundraiser': return '💰'
      default: return '📅'
    }
  }

  const categories = ['All', ...Array.from(new Set(events.map((e) => e.category))).sort()]

  if (!member) {
    return <NoMembershipState detail="no way to register" />
  }

  return (
    <EventsView
      events={events}
      loading={loading}
      categories={categories}
      category={filterCategory}
      onCategoryChange={setFilterCategory}
      getEventPrice={getEventPrice}
      isEventFull={isEventFull}
      isRegistrationClosed={isRegistrationClosed}
      onRegister={handleRegister}
      onUnregister={handleUnregister}
      cancelConfirmId={cancelConfirmId}
      onRequestCancel={setCancelConfirmId}
      cancelling={cancelling}
    />
  )
}
