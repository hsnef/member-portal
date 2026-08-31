'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { useTestData } from '@/lib/context/TestDataContext'
import { getTestAuthUserIds } from '@/lib/utils/testDataFiltering'

interface Event {
  id: string
  event_name: string
  event_date: string
  event_time: string
  location: string
  description: string
  category: string
  rsvp_enabled: boolean
  is_payable: boolean
  max_capacity: number
  member_price: number
  non_member_price: number
  registration_deadline: string
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed'
  registration_count?: number
  created_by?: string | null
  is_test_event?: boolean
}

export default function EventsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showTestData } = useTestData()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [showTestData])

  const fetchEvents = async () => {
    try {
      // Get test user IDs for filtering
      const testAuthUserIds = await getTestAuthUserIds()

      // Fetch events - filter based on toggle state
      let query = supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })

      // Filter out test events unless showTestData toggle is ON
      if (!showTestData && testAuthUserIds.length > 0) {
        query = query.not('created_by', 'in', `(${testAuthUserIds.join(',')})`)
      }

      const { data: eventsData, error: eventsError } = await query

      if (eventsError) throw eventsError

      // Get registration counts and mark test events
      const eventsWithDetails = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)

          // Check if this is a test-created event
          const isTestEvent = event.created_by && testAuthUserIds.includes(event.created_by)

          return {
            ...event,
            registration_count: count || 0,
            is_test_event: isTestEvent,
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

  const filteredEvents = events.filter((event) => {
    const matchesStatus = filterStatus === 'All' || event.status === filterStatus
    const matchesSearch =
      searchQuery === '' ||
      event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      case 'Completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const isEventFull = (event: Event) => {
    return event.max_capacity > 0 && (event.registration_count || 0) >= event.max_capacity
  }

  const isEventPast = (event: Event) => {
    return new Date(event.event_date) < new Date()
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Events</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage temple events and registrations
              </p>
            </div>
            <Link
              href="/admin/events/new"
              className="px-4 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-medium"
            >
              + Create Event
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600">
                {events.filter(e => e.status === 'Published').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">
                {events.filter(e => !isEventPast(e) && e.status === 'Published').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold text-orange-600">
                {events.reduce((sum, e) => sum + (e.registration_count || 0), 0)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search events by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
              />

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
              >
                <option value="All">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Events List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No events found</p>
                <Link
                  href="/admin/events/new"
                  className="inline-block px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
                >
                  Create First Event
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getCategoryIcon(event.category)}</span>
                          <h3 className="text-xl font-bold text-gray-900">
                            {event.event_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                          {isEventFull(event) && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              FULL
                            </span>
                          )}
                          {event.is_test_event && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              🧪 TEST
                            </span>
                          )}
                          {!event.rsvp_enabled && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                              Info Only
                            </span>
                          )}
                          {event.rsvp_enabled && event.is_payable && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              Paid
                            </span>
                          )}
                          {event.rsvp_enabled && !event.is_payable && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700">
                              Free
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">📅 Date:</span>{' '}
                            {new Date(event.event_date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">⏰ Time:</span> {event.event_time}
                          </div>
                          <div>
                            <span className="font-medium">📍 Location:</span> {event.location}
                          </div>
                          <div>
                            <span className="font-medium">🎫 Category:</span> {event.category}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Registrations:</span>{' '}
                            <span className="font-bold text-saffron">
                              {event.registration_count || 0}
                              {event.max_capacity > 0 && ` / ${event.max_capacity}`}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Member:</span>{' '}
                            ${event.member_price.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Non-Member:</span>{' '}
                            ${event.non_member_price.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col gap-2">
                        <button
                          onClick={() => router.push(`/admin/events/${event.id}`)}
                          className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                          className="px-4 py-2 text-sm bg-saffron text-white rounded-md hover:bg-saffron-hover"
                        >
                          Edit Event
                        </button>
                        <button
                          onClick={() => router.push(`/admin/events/${event.id}/registrations`)}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Registrations ({event.registration_count || 0})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
