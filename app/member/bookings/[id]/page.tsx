'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookingDetailView, type BookingDetail } from '@/components/member/BookingDetailView'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { FileQuestionIcon } from 'lucide-react'

export default function BookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const supabase = createClient()

  const [booking, setBooking] = useState<BookingDetail | null>(null)
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
        description="This booking may have been removed, or it belongs to a different membership."
        action={
          <AppLink to="/member/bookings">
            <Button>Back to my bookings</Button>
          </AppLink>
        }
      />
    )
  }

  return (
    <BookingDetailView
      booking={booking}
      onPay={(id) => router.push(`/member/bookings/${id}/payment`)}
    />
  )
}
