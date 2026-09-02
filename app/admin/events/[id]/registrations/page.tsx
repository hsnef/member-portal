'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { UsersIcon } from 'lucide-react'
import { formatDate } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'

interface Registration {
  id: string
  member_id: string
  membership_id: string
  registration_date: string
  registration_status: string
  attended: boolean
  payment_status?: string
  member_name?: string
  member_email?: string
  member_phone?: string
}

interface Event {
  id: string
  event_name: string
  event_date: string
  event_time: string
  location: string
  max_capacity: number
  member_price: number
  non_member_price: number
}

export default function EventRegistrationsPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const supabase = createClient()

  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (eventId) {
      fetchEventAndRegistrations()
    }
  }, [eventId])

  const fetchEventAndRegistrations = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Fetch registrations with member details
      const { data: regsData, error: regsError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          members:member_id (
            first_name,
            last_name,
            business_name,
            member_class,
            primary_email,
            primary_phone
          )
        `)
        .eq('event_id', eventId)
        .order('registration_date', { ascending: false })

      if (regsError) throw regsError

      // Transform data
      const transformedRegs = (regsData || []).map((reg: any) => ({
        ...reg,
        member_name: reg.members?.member_class === 'Personal'
          ? `${reg.members.first_name} ${reg.members.last_name}`
          : reg.members?.business_name || 'Unknown',
        member_email: reg.members?.primary_email,
        member_phone: reg.members?.primary_phone,
      }))

      setRegistrations(transformedRegs)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (registrationId: string, attended: boolean) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ attended })
        .eq('id', registrationId)

      if (error) throw error

      // Update local state
      setRegistrations(registrations.map(reg =>
        reg.id === registrationId ? { ...reg, attended } : reg
      ))
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert('Failed to update attendance')
    }
  }

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return

    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error

      alert('Registration cancelled successfully')
      fetchEventAndRegistrations()
    } catch (error) {
      console.error('Error cancelling registration:', error)
      alert('Failed to cancel registration')
    }
  }

  const filteredRegistrations = registrations.filter((reg) => {
    return (
      searchQuery === '' ||
      reg.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.membership_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.member_email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const attendedCount = registrations.filter(r => r.attended).length
  const confirmedCount = registrations.filter(r => r.registration_status === 'Confirmed').length

  const columns: Array<Column<Registration>> = [
    {
      key: 'member_name',
      header: 'Member',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{r.member_name ?? '\—'}</p>
          <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">{r.membership_id}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      secondary: true,
      cell: (r) => (
        <div className="min-w-0">
          {r.member_email && <p className="truncate text-ink-2">{r.member_email}</p>}
          {r.member_phone && (
            <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">{r.member_phone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'registration_date',
      header: 'Registered',
      sortable: true,
      cell: (r) => <span className="tnum text-ink-2">{formatDate(r.registration_date)}</span>,
    },
    {
      key: 'payment_status',
      header: 'Payment',
      cell: (r) =>
        r.payment_status ? (
          <Badge tone={r.payment_status === 'Paid' ? 'tulsi' : 'marigold'}>
            {r.payment_status}
          </Badge>
        ) : (
          <span className="text-ink-3">\—</span>
        ),
    },
    {
      key: 'attended',
      header: 'Attended',
      align: 'right',
      cell: (r) => (
        <Badge tone={r.attended ? 'tulsi' : 'neutral'}>{r.attended ? 'Yes' : 'Not yet'}</Badge>
      ),
    },
  ]

  const mobileCard = (r: Registration) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{r.member_name ?? '\—'}</p>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">{r.membership_id}</p>
        </div>
        <Badge tone={r.attended ? 'tulsi' : 'neutral'}>{r.attended ? 'Attended' : 'Not yet'}</Badge>
      </div>
      {r.member_email && <p className="truncate text-[13.5px] text-ink-2">{r.member_email}</p>}
    </div>
  )

  return (
    <AdminListView<Registration>
      eyebrow={event?.event_name ?? 'Event'}
      title="Registrations"
      description="Everyone registered for this event, and whether they have paid."
      noun="registration"
      rows={registrations}
      columns={columns}
      rowKey={(r) => r.id}
      mobileCard={mobileCard}
      loading={loading}
      searchPlaceholder="Search by member, membership number or email..."
      searchFields={(r) => [r.member_name, r.membership_id, r.member_email]}
      emptyIcon={UsersIcon}
      emptyTitle="No registrations yet"
      emptyDescription="When members register for this event they will be listed here."
    >
      {event && (
        <Card tone="sunk" spine="marigold" className="pl-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-serif text-[22px] leading-tight text-ink">{event.event_name}</p>
              <p className="tnum mt-1 text-[14px] text-ink-2">
                {formatDate(event.event_date)}
                {event.event_time ? ` \· ${event.event_time}` : ''}
                {event.location ? ` \· ${event.location}` : ''}
              </p>
            </div>
            <p className="tnum font-serif text-[28px] leading-none text-ink">
              {registrations.length}
              {event.max_capacity > 0 ? (
                <span className="text-[18px] text-ink-3"> / {event.max_capacity}</span>
              ) : null}
            </p>
          </div>
        </Card>
      )}
    </AdminListView>
  )
}
