'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  short_description: string | null
  description: string
  category: string
  max_capacity: number
  member_price: number
  non_member_price: number
  registration_deadline: string | null
  status: string
  image_url: string | null
  contact_email: string | null
  contact_phone: string | null
  registration_count?: number
  is_registered?: boolean
}

function getCategoryIcon(category: string) {
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

function EventDetailContent() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const { member } = useAuth()
  const supabase = createClient()

  const [event, setEvent] = useState<Event | null>(null)
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

    const price = getEventPrice()

    // If event has a price, redirect to payment page
    if (price > 0) {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The event you are looking for does not exist.'}</p>
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

  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const price = getEventPrice()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Event Image */}
      <div className="relative">
        {event.image_url ? (
          <div className="w-full h-64 md:h-96 relative">
            <img
              src={event.image_url}
              alt={event.event_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-64 md:h-96 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center relative">
            <span className="text-9xl">{getCategoryIcon(event.category)}</span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Link
            href="/member/events"
            className="px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-md hover:bg-white text-sm font-medium shadow"
          >
            ← Back to Events
          </Link>
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 right-4">
          <span className="px-4 py-2 bg-[#FF9933] text-white rounded-full text-sm font-semibold shadow">
            {event.category}
          </span>
        </div>

        {/* Registered Badge */}
        {event.is_registered && (
          <div className="absolute bottom-4 right-4">
            <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold shadow flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Registered
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 -mt-16 relative z-10">
        {/* Event Info Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-8 border-b">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {event.event_name}
            </h1>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📅</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                  <p className="font-semibold text-gray-900">{eventDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⏰</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                  <p className="font-semibold text-gray-900">{event.event_time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📍</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                  <p className="font-semibold text-gray-900">{event.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Price</p>
                  <p className="font-semibold text-[#FF9933]">
                    {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
                    {member?.current_level === 'Annual' || member?.current_level === 'Lifetime' ? (
                      <span className="text-xs text-green-600 ml-1">(Member)</span>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
            <div
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </div>

          {/* Registration Info */}
          {event.max_capacity > 0 && (
            <div className="px-6 md:px-8 pb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Registration</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {event.registration_count} / {event.max_capacity} spots filled
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#FF9933] h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((event.registration_count || 0) / event.max_capacity * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Info */}
          {(event.contact_email || event.contact_phone) && (
            <div className="px-6 md:px-8 pb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Contact Information</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {event.contact_email && (
                  <a href={`mailto:${event.contact_email}`} className="hover:text-[#FF9933]">
                    📧 {event.contact_email}
                  </a>
                )}
                {event.contact_phone && (
                  <a href={`tel:${event.contact_phone}`} className="hover:text-[#FF9933]">
                    📞 {event.contact_phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6 md:p-8 bg-gray-50 border-t">
            {event.is_registered ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-semibold">You are registered for this event!</p>
                  <p className="text-sm text-green-600 mt-1">A confirmation has been sent to your email.</p>
                </div>

                {cancelConfirm ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium mb-3">Are you sure you want to cancel your registration?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleUnregister}
                        disabled={cancelling}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 font-medium"
                      >
                        {cancelling ? 'Cancelling...' : 'Yes, Cancel Registration'}
                      </button>
                      <button
                        onClick={() => setCancelConfirm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-white"
                      >
                        Keep Registration
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                  >
                    Cancel Registration
                  </button>
                )}
              </div>
            ) : isRegistrationClosed() ? (
              <button
                disabled
                className="w-full px-6 py-3 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed font-semibold"
              >
                Registration Closed
              </button>
            ) : isEventFull() ? (
              <button
                disabled
                className="w-full px-6 py-3 bg-red-100 text-red-600 rounded-md cursor-not-allowed font-semibold"
              >
                Event Full
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="w-full px-6 py-3 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] disabled:bg-gray-300 font-semibold text-lg"
              >
                {registering
                  ? 'Registering...'
                  : price > 0
                    ? `Register Now - $${price.toFixed(2)}`
                    : 'Register Now (Free)'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EventDetailPage() {
  return (
    <ProtectedRoute>
      <EventDetailContent />
    </ProtectedRoute>
  )
}
