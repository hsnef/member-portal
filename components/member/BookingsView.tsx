'use client'

/**
 * "My bookings" list — presentation only.
 *
 * NOTE: unlike /member/requests, this list filters SERVER-SIDE — the status
 * filter is part of the Supabase query. So `filter` is a controlled prop and
 * changing it re-runs the fetch in page.tsx. Do not filter `bookings` here.
 *
 * Exemplar: design-kit/pages/Requests.tsx (data-table list archetype)
 */

import React, { useMemo, useState } from 'react'
import { CalendarPlusIcon, FlameIcon } from 'lucide-react'
import { AppLink } from '@/components/nav/Nav'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { formatCurrency, formatDate } from '@/utils/format'
import type { RequestStatus } from '@/types/design-system'

export interface MemberBooking {
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

export type BookingFilter = 'all' | 'pending' | 'approved' | 'paid' | 'completed'

const FILTERS: readonly BookingFilter[] = ['all', 'pending', 'approved', 'paid', 'completed']

/** FilterTabs shows these; the values above are what the query understands. */
const FILTER_LABEL: Record<BookingFilter, string> = {
  all: 'All',
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
  completed: 'Completed',
}

export interface BookingsViewProps {
  bookings: MemberBooking[]
  loading: boolean
  filter: BookingFilter
  onFilterChange: (filter: BookingFilter) => void
  onOpen: (bookingId: string) => void
  onPay: (bookingId: string) => void
}

export function BookingsView({
  bookings,
  loading,
  filter,
  onFilterChange,
  onOpen,
  onPay,
}: BookingsViewProps) {
  const [search, setSearch] = useState('')

  // Search is client-side over the server-filtered page of rows.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return bookings
    return bookings.filter(
      (b) =>
        b.requester_name?.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.additional_notes ?? '').toLowerCase().includes(q)
    )
  }, [bookings, search])

  const isPayable = (b: MemberBooking) => b.status === 'Approved'

  const columns: Array<Column<MemberBooking>> = [
    {
      key: 'id',
      header: 'Booking',
      cell: (b) => (
        <div className="min-w-0">
          <p className="tnum truncate font-semibold text-ink">
            #{b.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-0.5 truncate text-[13.5px] text-ink-3">{b.requester_name}</p>
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
        <div className="flex justify-end gap-2">
          {isPayable(b) && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onPay(b.id)
              }}
            >
              Pay
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              onOpen(b.id)
            }}
          >
            View
          </Button>
        </div>
      ),
    },
  ]

  const mobileCard = (b: MemberBooking) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="tnum truncate font-semibold text-ink">
            #{b.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-0.5 truncate text-[13.5px] text-ink-3">{b.requester_name}</p>
        </div>
        <StatusBadge status={b.status as RequestStatus} />
      </div>
      <div className="flex items-center justify-between text-[14px]">
        <span className="tnum text-ink-2">{formatDate(b.created_at)}</span>
        <span className="tnum font-serif text-[20px] text-ink">
          {formatCurrency(b.total_amount)}
        </span>
      </div>
      <div className="flex gap-2">
        {isPayable(b) && (
          <Button size="sm" fullWidth onClick={() => onPay(b.id)}>
            Pay {formatCurrency(b.total_amount)}
          </Button>
        )}
        <Button size="sm" variant="secondary" fullWidth onClick={() => onOpen(b.id)}>
          View
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Your account"
        title="My bookings"
        description="Pujas, havans and other services you have booked at the temple."
        actions={
          <AppLink to="/member/bookings/new">
            <Button icon={CalendarPlusIcon}>Book a service</Button>
          </AppLink>
        }
      />

      <FilterTabs
        label="Filter bookings by status"
        options={FILTERS}
        value={filter}
        onChange={onFilterChange}
        renderLabel={(f) => FILTER_LABEL[f]}
      />

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by reference, name or notes…"
        summary={`${rows.length} booking${rows.length === 1 ? '' : 's'}`}
      />

      <DataTable
        caption="Your service bookings"
        columns={columns}
        rows={rows}
        rowKey={(b) => b.id}
        mobileCard={mobileCard}
        onRowClick={(b) => onOpen(b.id)}
        loading={loading}
        empty={
          <EmptyState
            icon={FlameIcon}
            title={filter === 'all' ? 'No bookings yet' : `No ${FILTER_LABEL[filter].toLowerCase()} bookings`}
            description={
              filter === 'all'
                ? 'Book an archana, abhishekam, havan or samskara and it will appear here.'
                : 'Try another status, or book a new service.'
            }
            action={
              <AppLink to="/member/bookings/new">
                <Button icon={CalendarPlusIcon}>Book a service</Button>
              </AppLink>
            }
          />
        }
      />
    </div>
  )
}
