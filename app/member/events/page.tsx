'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getTestAuthUserIds, isTestIsolationMode } from '@/lib/utils/testDataFiltering'

interface Event {
  id: string
  event_name: string
  event_date: string
  event_time: string
  location: string
  short_description: string | null
  description: string
  category: string
  rsvp_enabled: boolean
  is_payable: boolean
  max_capacity: number
  member_price: number
  non_member_price: number
  registration_deadline: string
  image_url?: string
  contact_email?: string
  contact_phone?: string
  registration_count?: number
  is_registered?: boolean
}

// Helper function to strip HTML tags and get plain text
function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

// Get display description (prefer short_description, fallback to stripped description)
function getDisplayDescription(event: Event): string {
  if (event.short_description) {
    return event.short_description
  }
  return stripHtml(event.description)
}

export default function MemberEventsPage() {
  const router = useRouter()
  const { member } = useAuth()
  const supabase = createClient()

  const [events, setEvents] = useState<Event[]>([])
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
  const getEventPrice = (event: Event): number => {
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

  const isEventFull = (event: Event) => {
    return event.max_capacity > 0 && (event.registration_count || 0) >= event.max_capacity
  }

  const isRegistrationClosed = (event: Event) => {
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.push('/member')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
            <p className="mt-1 text-sm text-gray-600">
              Register for temple events and activities
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
              >
                <option value="All">All Categories</option>
                <option value="Festival">Festival</option>
                <option value="Puja">Puja</option>
                <option value="Educational">Educational</option>
                <option value="Social">Social</option>
                <option value="Cultural">Cultural</option>
                <option value="Fundraiser">Fundraiser</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No upcoming events at this time</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Event Image - Clickable */}
                  <div
                    onClick={() => router.push(`/member/events/${event.id}`)}
                    className="cursor-pointer"
                  >
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.event_name}
                        className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center hover:opacity-90 transition-opacity">
                        <span className="text-8xl">{getCategoryIcon(event.category)}</span>
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#FF9933] uppercase tracking-wide">
                        {event.category}
                      </span>
                      {event.is_registered && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          ✓ Registered
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => router.push(`/member/events/${event.id}`)}
                      className="text-xl font-bold text-gray-900 mb-2 hover:text-[#FF9933] cursor-pointer transition-colors"
                    >
                      {event.event_name}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">⏰</span>
                        {event.event_time}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📍</span>
                        {event.location}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {getDisplayDescription(event)}
                    </p>

                    {/* View Details Link */}
                    <button
                      onClick={() => router.push(`/member/events/${event.id}`)}
                      className="text-sm text-[#FF9933] hover:text-[#E68A2E] font-medium mb-4 inline-flex items-center"
                    >
                      View Details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Price and Capacity */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b">
                      <div>
                        <p className="text-xs text-gray-500">Price (Member)</p>
                        <p className="text-lg font-bold text-[#FF9933]">
                          {event.member_price === 0 ? 'Free' : `$${event.member_price.toFixed(2)}`}
                        </p>
                      </div>
                      {event.max_capacity > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Capacity</p>
                          <p className="text-sm font-semibold text-gray-700">
                            {event.registration_count} / {event.max_capacity}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {event.is_registered ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => router.push(`/member/events/${event.id}`)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                        >
                          View Details
                        </button>
                        {cancelConfirmId === event.id ? (
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-800 mb-2">Cancel your registration for this event?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUnregister(event.id)}
                                disabled={cancelling}
                                className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-300"
                              >
                                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                              </button>
                              <button
                                onClick={() => setCancelConfirmId(null)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                              >
                                Keep Registration
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancelConfirmId(event.id)}
                            className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm"
                          >
                            Cancel Registration
                          </button>
                        )}
                      </div>
                    ) : !event.rsvp_enabled ? (
                      /* RSVP Disabled - Informational Event */
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500 italic">No registration required</p>
                        <button
                          onClick={() => router.push(`/member/events/${event.id}`)}
                          className="mt-2 text-sm text-[#FF9933] hover:text-[#E68A2E] font-medium"
                        >
                          View Event Details →
                        </button>
                      </div>
                    ) : isRegistrationClosed(event) ? (
                      <button
                        disabled
                        className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                      >
                        Registration Closed
                      </button>
                    ) : isEventFull(event) ? (
                      <button
                        disabled
                        className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-md cursor-not-allowed font-medium"
                      >
                        Event Full
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(event.id)}
                        className="w-full px-4 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] font-semibold"
                      >
                        {event.is_payable
                          ? `Register - $${getEventPrice(event).toFixed(2)}`
                          : 'RSVP Now (Free)'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
