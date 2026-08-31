'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTestData } from '@/lib/context/TestDataContext'
import { getTestMemberIds } from '@/lib/utils/testDataFiltering'

interface Booking {
  id: string
  member_id?: string
  requester_name: string
  requester_phone: string
  requester_email: string
  total_amount: number
  status: string
  created_at: string
  members?: {
    membership_number: string
    first_name: string
    last_name: string
  }
  is_test_booking?: boolean
}

export default function AdminBookingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showTestData } = useTestData()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [filter, showTestData])

  const fetchBookings = async () => {
    try {
      setLoading(true)

      // Get test member IDs for filtering
      const testMemberIds = await getTestMemberIds()

      let query = supabase
        .from('service_bookings')
        .select(`
          *,
          members (
            membership_number,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })

      // Filter out test bookings unless showTestData toggle is ON
      if (!showTestData && testMemberIds.length > 0) {
        query = query.not('member_id', 'in', `(${testMemberIds.join(',')})`)
      }

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

      // Mark bookings as test bookings
      const bookingsWithTestFlag = (data || []).map((booking) => ({
        ...booking,
        is_test_booking: booking.member_id && testMemberIds.includes(booking.member_id),
      }))

      setBookings(bookingsWithTestFlag)
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

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      booking.requester_name.toLowerCase().includes(search) ||
      booking.requester_email?.toLowerCase().includes(search) ||
      booking.requester_phone?.toLowerCase().includes(search) ||
      booking.members?.membership_number.toLowerCase().includes(search) ||
      booking.id.toLowerCase().includes(search)
    )
  })

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service Bookings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage and approve service booking requests
            </p>
          </div>
          <Link
            href="/admin/bookings/new"
            className="px-4 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold"
          >
            + New Booking
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search by name, email, phone, or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
              />
            </div>

            {/* Filter buttons */}
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

            <div className="text-sm text-gray-600">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
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
                {searchTerm ? 'Try adjusting your search' : 'No bookings have been created yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-transparent">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-transparent">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        #{booking.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {booking.members ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {booking.members.first_name} {booking.members.last_name}
                            </div>
                            <div className="text-gray-500">{booking.members.membership_number}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Community Member</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{booking.requester_name}</div>
                        <div className="text-gray-500">{booking.requester_phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${booking.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                          {booking.is_test_booking && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              🧪 TEST
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                            className="text-saffron hover:text-saffron-hover"
                          >
                            View
                          </button>
                          {booking.status === 'Pending Approval' && (
                            <button
                              onClick={() => router.push(`/admin/bookings/${booking.id}/review`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
