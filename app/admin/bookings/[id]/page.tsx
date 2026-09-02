'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  AdminBookingDetailView,
  type AdminBooking,
} from '@/components/admin/AdminBookingDetailView'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { FileQuestionIcon } from 'lucide-react'

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
  const { user, member: staffMember } = useAuth()

  const [booking, setBooking] = useState<AdminBooking | null>(null)
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

      // useAuth already resolves the signed-in staff member. The previous
      // lookup keyed off an undefined value, so it always failed: every
      // approval was recorded as "Staff" with a null reviewed_by.
      const staffName =
        [staffMember?.first_name, staffMember?.last_name].filter(Boolean).join(' ') || 'Staff'

      const { error } = await supabase
        .from('service_bookings')
        .update({
          status: 'Approved',
          reviewed_by: user?.id ?? null,
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

      // useAuth already resolves the signed-in staff member. The previous
      // lookup keyed off an undefined value, so it always failed: every
      // approval was recorded as "Staff" with a null reviewed_by.
      const staffName =
        [staffMember?.first_name, staffMember?.last_name].filter(Boolean).join(' ') || 'Staff'

      const { error } = await supabase
        .from('service_bookings')
        .update({
          status: 'Rejected',
          reviewed_by: user?.id ?? null,
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
      <>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </>
    )
  }

  if (!booking) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-gray-600">Booking not found</p>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading this booking…</span>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!booking) {
    return (
      <EmptyState
        icon={FileQuestionIcon}
        title="Booking not found"
        description="This booking may have been removed."
        action={
          <AppLink to="/admin/bookings">
            <Button>Back to bookings</Button>
          </AppLink>
        }
      />
    )
  }

  return (
    <AdminBookingDetailView
      booking={booking}
      processing={processing}
      showApproveModal={showApproveModal}
      onShowApprove={setShowApproveModal}
      showRejectModal={showRejectModal}
      onShowReject={setShowRejectModal}
      approvalNotes={approvalNotes}
      onApprovalNotesChange={setApprovalNotes}
      rejectionReason={rejectionReason}
      onRejectionReasonChange={setRejectionReason}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  )
}
