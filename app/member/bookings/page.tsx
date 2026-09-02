'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  BookingsView,
  type MemberBooking,
  type BookingFilter,
} from '@/components/member/BookingsView'
import { NoMembershipState } from '@/components/member/NoMembershipState'

export default function MemberBookingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { member } = useAuth()

  const [bookings, setBookings] = useState<MemberBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<BookingFilter>('all')

  useEffect(() => {
    fetchBookings()
  }, [filter, member])

  const fetchBookings = async () => {
    try {
      setLoading(true)

      if (!member) {
        setBookings([])
        return
      }

      let query = supabase
        .from('service_bookings')
        .select('*')
        .eq('member_id', member.id)
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

  if (!member) {
    return <NoMembershipState detail="nothing booked" />
  }

  return (
    <BookingsView
      bookings={bookings}
      loading={loading}
      filter={filter}
      onFilterChange={setFilter}
      onOpen={(id) => router.push(`/member/bookings/${id}`)}
      onPay={(id) => router.push(`/member/bookings/${id}/payment`)}
    />
  )
}
