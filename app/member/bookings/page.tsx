'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'

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
}

export default function MemberBookingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userData } = useAuth()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'completed'>('all')

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    try {
      setLoading(true)

      // Get member ID
      const { data: memberData } = await supabase
        .from('members')
        .select('id')
        .eq('auth_user_id', userData?.user?.id)
        .single()

      if (!memberData) {
        setBookings([])
        return
      }

      let query = supabase
        .from('service_bookings')
        .select('*')
        .eq('member_id', memberData.id)
        .order('created_at', { ascending: false })

      if (filter === 'pending') {
        query = query.eq('status', 'Pending Approval')
      } else if (filter === 'approved') {
        query = query.eq('status', 'Approved')
      } else if (filter === 'paid') {
        query = query.eq('status', 'Paid')
      } else if (filter === 'completed') {
        query = query.eq('status', 'Completed')
      }

      const { data, error } = await query

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
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

  return (
    <>
      <div className="bg-transparent py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => router.push('/member')}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">My Service Bookings</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage your service booking requests
              </p>
            </div>
            <Link
              href="/member/bookings/new"
              className="px-4 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold"
            >
              + New Booking
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-saffron text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-saffron text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending Approval
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'approved'
                    ? 'bg-saffron text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'paid'
                    ? 'bg-saffron text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-saffron text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new service booking
              </p>
              <div className="mt-6">
                <Link
                  href="/member/bookings/new"
                  className="inline-flex items-center px-4 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold"
                >
                  + New Booking
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Booking #{booking.id.slice(0, 8)}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Submitted on {new Date(booking.created_at).toLocaleDateString()} at{' '}
                        {new Date(booking.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-saffron">
                        ${booking.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Requester Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{booking.requester_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{booking.requester_phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{booking.requester_email}</p>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {booking.status === 'Approved' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        ✓ Your booking has been approved! Please proceed with payment.
                      </p>
                      {booking.approval_notes && (
                        <p className="text-xs text-blue-700 mt-1">
                          Note: {booking.approval_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {booking.status === 'Rejected' && booking.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-red-800 font-medium">
                        Booking Rejected
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Reason: {booking.rejection_reason}
                      </p>
                    </div>
                  )}

                  {booking.status === 'Pending Approval' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        ⏳ Your booking is pending approval from our staff. You will be notified once reviewed.
                      </p>
                    </div>
                  )}

                  {booking.status === 'Paid' && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-green-800">
                        ✓ Payment received. Your services will be performed as scheduled.
                      </p>
                    </div>
                  )}

                  {booking.status === 'Completed' && (
                    <div className="bg-transparent border border-gray-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-gray-800">
                        ✓ Services completed. Thank you for your booking!
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/member/bookings/${booking.id}`)}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                    >
                      View Details
                    </button>
                    {booking.status === 'Approved' && (
                      <button
                        onClick={() => router.push(`/member/bookings/${booking.id}/payment`)}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
