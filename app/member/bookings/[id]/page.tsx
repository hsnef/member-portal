'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'

interface BookingItem {
  id: string
  service_id: string
  purohit_id: string
  service_date: string
  service_time: string
  location_type: string
  location_address: string
  notes?: string
  price: number
  services: {
    name: string
    display_name?: string
  }
  purohits: {
    name: string
  }
}

interface Booking {
  id: string
  requester_name: string
  requester_phone: string
  requester_email: string
  total_amount: number
  status: string
  additional_notes?: string
  created_at: string
  reviewed_by_name?: string
  reviewed_at?: string
  approval_notes?: string
  rejection_reason?: string
  service_booking_items: BookingItem[]
}

export default function BookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const supabase = createClient()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          service_booking_items (
            *,
            services (name, display_name),
            purohits (name)
          )
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error
      setBooking(data)
    } catch (error) {
      console.error('Error fetching booking:', error)
      alert('Failed to load booking')
      router.push('/member/bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-800'
      case 'Approved':
        return 'bg-blue-100 text-blue-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      case 'Paid':
        return 'bg-green-100 text-green-800'
      case 'Completed':
        return 'bg-gray-100 text-gray-800'
      case 'Cancelled':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!booking) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Booking not found</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/member/bookings')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to Bookings
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Booking #{booking.id.slice(0, 8)}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Submitted on {new Date(booking.created_at).toLocaleDateString()} at{' '}
                  {new Date(booking.created_at).toLocaleTimeString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                  booking.status
                )}`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          {/* Status Messages */}
          {booking.status === 'Approved' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-medium">
                ✓ Your booking has been approved!
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Please proceed with payment to confirm your booking.
              </p>
              {booking.approval_notes && (
                <p className="text-sm text-blue-700 mt-2">
                  <strong>Staff Note:</strong> {booking.approval_notes}
                </p>
              )}
              <button
                onClick={() => router.push(`/member/bookings/${booking.id}/payment`)}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
              >
                Pay Now
              </button>
            </div>
          )}

          {booking.status === 'Rejected' && booking.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">Booking Rejected</p>
              <p className="text-sm text-red-700 mt-2">
                <strong>Reason:</strong> {booking.rejection_reason}
              </p>
              <p className="text-sm text-red-600 mt-2">
                Please contact the office if you have questions.
              </p>
            </div>
          )}

          {booking.status === 'Pending Approval' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                ⏳ Your booking is pending approval from our staff. You will be notified once reviewed.
              </p>
            </div>
          )}

          {booking.status === 'Paid' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                ✓ Payment Received
              </p>
              <p className="text-sm text-green-700 mt-1">
                Your services will be performed as scheduled. Thank you!
              </p>
            </div>
          )}

          {booking.status === 'Completed' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-gray-800 font-medium">
                ✓ Services Completed
              </p>
              <p className="text-sm text-gray-700 mt-1">
                Thank you for your booking! We hope the services met your expectations.
              </p>
            </div>
          )}

          {/* Requester Information */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Requester Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{booking.requester_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{booking.requester_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{booking.requester_email}</p>
              </div>
            </div>
          </div>

          {/* Service Items */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Booked Services
            </h2>
            <div className="space-y-4">
              {booking.service_booking_items.map((item, index) => (
                <div
                  key={item.id}
                  className="border-b pb-4 last:border-b-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {index + 1}. {item.services.name}
                        {item.services.display_name && (
                          <span className="text-gray-600 font-normal ml-1">
                            ({item.services.display_name})
                          </span>
                        )}
                      </h3>
                    </div>
                    <p className="text-lg font-semibold text-[#FF9933] ml-4">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <p className="text-gray-600">Date & Time</p>
                      <p className="font-medium text-gray-900">
                        {new Date(item.service_date).toLocaleDateString()} at {item.service_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Priest</p>
                      <p className="font-medium text-gray-900">{item.purohits.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">
                        {item.location_type === 'Temple' ? 'At Temple' : 'External Location'}
                      </p>
                    </div>
                    {item.location_type === 'External' && (
                      <div>
                        <p className="text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">{item.location_address}</p>
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <div className="mt-3 text-sm">
                      <p className="text-gray-600">Service Notes</p>
                      <p className="text-gray-900 italic">{item.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          {booking.additional_notes && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Additional Notes
              </h2>
              <p className="text-gray-700">{booking.additional_notes}</p>
            </div>
          )}

          {/* Total */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-900">Total Amount</span>
              <span className="text-3xl font-bold text-[#FF9933]">
                ${booking.total_amount.toFixed(2)}
              </span>
            </div>
            {booking.reviewed_by_name && booking.reviewed_at && (
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <p>
                  Reviewed by {booking.reviewed_by_name} on{' '}
                  {new Date(booking.reviewed_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
