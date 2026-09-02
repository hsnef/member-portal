'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AdminListView } from '@/components/admin/AdminListView'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { FlameIcon, CalendarPlusIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'
import type { RequestStatus } from '@/types/design-system'
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

  const columns: Array<Column<Booking>> = [
    {
      key: 'requester_name',
      header: 'Requested by',
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{b.requester_name}</p>
          <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">
            {b.members?.membership_number ?? `#${b.id.slice(0, 8).toUpperCase()}`}
          </p>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Requested',
      sortable: true,
      secondary: true,
      cell: (b) => <span className="tnum text-ink-2">{formatDate(b.created_at)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => <StatusBadge status={b.status as RequestStatus} />,
    },
    {
      key: 'total_amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      cell: (b) => (
        <span className="tnum font-semibold text-ink">{formatCurrency(b.total_amount)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (b) => (
        <AppLink to={`/admin/bookings/${b.id}`}>
          <Button size="sm" variant="secondary">
            Review
          </Button>
        </AppLink>
      ),
    },
  ]

  const mobileCard = (b: Booking) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{b.requester_name}</p>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">{formatDate(b.created_at)}</p>
        </div>
        <StatusBadge status={b.status as RequestStatus} />
      </div>
      <p className="tnum font-serif text-[20px] text-ink">{formatCurrency(b.total_amount)}</p>
    </div>
  )

  return (
    <AdminListView<Booking>
      eyebrow="Office console"
      title="Bookings"
      description="Service bookings requested by members. Approve, assign a purohit and invoice."
      noun="booking"
      actions={
        <AppLink to="/admin/bookings/new">
          <Button icon={CalendarPlusIcon}>New booking</Button>
        </AppLink>
      }
      rows={bookings}
      columns={columns}
      rowKey={(b) => b.id}
      mobileCard={mobileCard}
      onRowClick={(b) => router.push(`/admin/bookings/${b.id}`)}
      loading={loading}
      searchPlaceholder="Search by name, email, phone or reference…"
      searchFields={(b) => [
        b.requester_name,
        b.requester_email,
        b.requester_phone,
        b.members?.membership_number,
        b.id,
      ]}
      /* Status is filtered in the QUERY; see fetchBookings. */
      filters={['all', 'pending', 'approved', 'paid', 'completed']}
      filterLabels={{
        all: 'All',
        pending: 'Pending approval',
        approved: 'Approved',
        paid: 'Paid',
        completed: 'Completed',
      }}
      filterValue={filter}
      onFilterChange={(v) => setFilter(v as typeof filter)}
      emptyIcon={FlameIcon}
      emptyTitle="No bookings yet"
      emptyDescription="Service bookings requested by members will appear here for approval."
    />
  )
}
