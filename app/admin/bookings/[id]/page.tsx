'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'

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
  member_id?: string
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
  members?: {
    membership_number: string
    first_name: string
    last_name: string
    current_level: string
  }
  service_booking_items: BookingItem[]
}

export default function AdminBookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const supabase = createClient()
  const { userData } = useAuth()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Approval/Rejection form
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

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
          members (
            membership_number,
            first_name,
            last_name,
            current_level
          ),
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
      router.push('/admin/bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!booking) return

    try {
      setProcessing(true)

      // Get staff info
      const { data: staffMemberData } = await supabase
        .from('members')
        .select('first_name, last_name')
        .eq('auth_user_id', userData?.user?.id)
        .single()

      const staffName = staffMemberData
        ? `${staffMemberData.first_name} ${staffMemberData.last_name}`
        : 'Staff'

      const { error } = await supabase
        .from('service_bookings')
        .update({
          status: 'Approved',
          reviewed_by: userData?.user?.id,
          reviewed_by_name: staffName,
          reviewed_at: new Date().toISOString(),
          approval_notes: approvalNotes.trim() || null,
        })
        .eq('id', bookingId)

      if (error) throw error

      // Send approval notification with payment link
      try {
        await fetch('/api/bookings/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            status: 'Approved',
          }),
        })
        alert('Booking approved and notification sent to member!')
      } catch (emailError) {
        console.warn('Failed to send approval notification:', emailError)
        alert('Booking approved but failed to send email notification.')
      }

      setShowApproveModal(false)
      fetchBooking()
    } catch (error: any) {
      console.error('Error approving booking:', error)
      alert(`Failed to approve booking: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!booking) return

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      setProcessing(true)

      // Get staff info
      const { data: staffMemberData } = await supabase
        .from('members')
        .select('first_name, last_name')
        .eq('auth_user_id', userData?.user?.id)
        .single()

      const staffName = staffMemberData
        ? `${staffMemberData.first_name} ${staffMemberData.last_name}`
        : 'Staff'

      const { error } = await supabase
        .from('service_bookings')
        .update({
          status: 'Rejected',
          reviewed_by: userData?.user?.id,
          reviewed_by_name: staffName,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason.trim(),
        })
        .eq('id', bookingId)

      if (error) throw error

      alert('Booking rejected')
      setShowRejectModal(false)
      fetchBooking()
    } catch (error: any) {
      console.error('Error rejecting booking:', error)
      alert(`Failed to reject booking: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleMarkAsCompleted = async () => {
    if (!booking) return
    if (!confirm('Mark this booking as completed?')) return

    try {
      setProcessing(true)

      const { error } = await supabase
        .from('service_bookings')
        .update({ status: 'Completed' })
        .eq('id', bookingId)

      if (error) throw error

      alert('Booking marked as completed!')
      fetchBooking()
    } catch (error: any) {
      console.error('Error updating booking:', error)
      alert(`Failed to update booking: ${error.message}`)
    } finally {
      setProcessing(false)
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
      <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
        <AdminLayout>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading booking details...</p>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (!booking) {
    return (
      <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
        <AdminLayout>
          <div className="text-center py-12">
            <p className="text-gray-600">Booking not found</p>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/admin/bookings')}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Back to Bookings
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  Booking #{booking.id.slice(0, 8)}
                </h1>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {booking.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Created on {new Date(booking.created_at).toLocaleDateString()} at{' '}
                {new Date(booking.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {booking.status === 'Pending Approval' && (
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                >
                  Approve Booking
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
                >
                  Reject Booking
                </button>
              </div>
            </div>
          )}

          {booking.status === 'Paid' && (
            <div className="bg-white shadow rounded-lg p-4">
              <button
                onClick={handleMarkAsCompleted}
                disabled={processing}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold disabled:bg-gray-300"
              >
                Mark as Completed
              </button>
            </div>
          )}

          {/* Member Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Member Information</h2>
            {booking.members ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Membership Number</p>
                  <p className="font-medium text-gray-900">{booking.members.membership_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {booking.members.first_name} {booking.members.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Membership Level</p>
                  <p className="font-medium text-gray-900">{booking.members.current_level}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Community Member (No membership record)</p>
            )}
          </div>

          {/* Requester Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Requester Information</h2>
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
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Booked Services</h2>
            <div className="space-y-4">
              {booking.service_booking_items.map((item, index) => (
                <div key={item.id} className="border-b pb-4 last:border-b-0">
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
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
              <p className="text-gray-700">{booking.additional_notes}</p>
            </div>
          )}

          {/* Review Information */}
          {booking.reviewed_by_name && booking.reviewed_at && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Reviewed By</p>
                  <p className="font-medium text-gray-900">{booking.reviewed_by_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reviewed At</p>
                  <p className="font-medium text-gray-900">
                    {new Date(booking.reviewed_at).toLocaleString()}
                  </p>
                </div>
                {booking.approval_notes && (
                  <div>
                    <p className="text-sm text-gray-600">Approval Notes</p>
                    <p className="text-gray-900">{booking.approval_notes}</p>
                  </div>
                )}
                {booking.rejection_reason && (
                  <div>
                    <p className="text-sm text-gray-600">Rejection Reason</p>
                    <p className="text-red-700">{booking.rejection_reason}</p>
                  </div>
                )}
              </div>
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
          </div>
        </div>

        {/* Approve Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Approve Booking</h3>
              <p className="text-sm text-gray-600 mb-4">
                Approving this booking will allow the member to proceed with payment.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approval Notes (optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                  placeholder="Any notes or instructions for the member..."
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowApproveModal(false)}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 font-semibold"
                >
                  {processing ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Reject Booking</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this booking. The member will be notified.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                  placeholder="Reason for rejection..."
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 font-semibold"
                >
                  {processing ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  )
}
