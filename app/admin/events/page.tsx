'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { CalendarDaysIcon, CalendarPlusIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'
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

  const statusTone: Record<string, 'tulsi' | 'neutral' | 'danger' | 'sandal'> = {
    Published: 'tulsi',
    Draft: 'neutral',
    Cancelled: 'danger',
    Completed: 'sandal',
  }

  const columns: Array<Column<Event>> = [
    {
      key: 'event_name',
      header: 'Event',
      cell: (e) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{e.event_name}</p>
          <p className="mt-0.5 truncate text-[13px] text-ink-3">{e.category}</p>
        </div>
      ),
    },
    {
      key: 'event_date',
      header: 'When',
      sortable: true,
      cell: (e) => (
        <div className="min-w-0">
          <p className="tnum text-ink-2">{formatDate(e.event_date)}</p>
          {e.event_time && <p className="tnum mt-0.5 text-[13px] text-ink-3">{e.event_time}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (e) => <Badge tone={statusTone[e.status] ?? 'neutral'}>{e.status}</Badge>,
    },
    {
      key: 'registrations',
      header: 'Registered',
      align: 'right',
      secondary: true,
      cell: (e) => (
        <span className="tnum text-ink-2">
          {e.registration_count ?? 0}
          {e.max_capacity > 0 ? ` / ${e.max_capacity}` : ''}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Member price',
      align: 'right',
      secondary: true,
      cell: (e) => (
        <span className="tnum text-ink-2">
          {e.is_payable && e.member_price > 0 ? formatCurrency(e.member_price) : 'Free'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (e) => (
        <div className="flex justify-end gap-2">
          <AppLink to={`/admin/events/${e.id}/registrations`}>
            <Button size="sm" variant="ghost">
              Registrations
            </Button>
          </AppLink>
          <AppLink to={`/admin/events/${e.id}/edit`}>
            <Button size="sm" variant="secondary">
              Edit
            </Button>
          </AppLink>
        </div>
      ),
    },
  ]

  const mobileCard = (e: Event) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{e.event_name}</p>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">{formatDate(e.event_date)}</p>
        </div>
        <Badge tone={statusTone[e.status] ?? 'neutral'}>{e.status}</Badge>
      </div>
      <p className="tnum text-[13.5px] text-ink-2">
        {e.registration_count ?? 0}
        {e.max_capacity > 0 ? ` of ${e.max_capacity}` : ''} registered
      </p>
    </div>
  )

  return (
    <AdminListView<Event>
      eyebrow="Office console"
      title="Events"
      description="Festivals, classes and seva. Publish an event to open registration."
      noun="event"
      actions={
        <AppLink to="/admin/events/new">
          <Button icon={CalendarPlusIcon}>Create event</Button>
        </AppLink>
      }
      rows={events}
      columns={columns}
      rowKey={(e) => e.id}
      mobileCard={mobileCard}
      loading={loading}
      searchPlaceholder="Search by name or category…"
      searchFields={(e) => [e.event_name, e.category]}
      filters={['All', 'Draft', 'Published', 'Cancelled', 'Completed']}
      filterValue={filterStatus}
      onFilterChange={setFilterStatus}
      filterFn={(e, f) => f === 'All' || e.status === f}
      emptyIcon={CalendarDaysIcon}
      emptyTitle="No events yet"
      emptyDescription="Create an event to publish it to members and open registration."
      emptyAction={
        <AppLink to="/admin/events/new">
          <Button icon={CalendarPlusIcon}>Create the first event</Button>
        </AppLink>
      }
    />
  )
}
