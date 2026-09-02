'use client'

/**
 * "My requests" list — presentation only.
 *
 * app/member/requests/page.tsx owns the Supabase query, the invoice PDF
 * generation and navigation.
 *
 * Exemplar: design-kit/pages/Requests.tsx (data-table list archetype)
 */

import React, { useMemo, useState } from 'react'
import { DownloadIcon, ReceiptTextIcon, ScrollTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { formatCurrency, formatDate } from '@/utils/format'
import type { RequestStatus } from '@/types/design-system'

export interface MemberRequest {
  id: string
  request_type: string
  service_description: string
  requested_date: string
  amount: number
  status: RequestStatus
  payment_id?: string
  notes?: string
  created_at: string
  due_date?: string
}

const FILTERS = ['All', 'Sent', 'Paid', 'Completed', 'Cancelled'] as const
type Filter = (typeof FILTERS)[number]

export interface RequestsViewProps {
  requests: MemberRequest[]
  loading: boolean
  onPay: (requestId: string) => void
  onDownloadInvoice: (request: MemberRequest) => void
}

export function RequestsView({
  requests,
  loading,
  onPay,
  onDownloadInvoice,
}: RequestsViewProps) {
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requests.filter((r) => {
      const matchesFilter = filter === 'All' || r.status === filter
      const matchesSearch =
        q === '' ||
        r.request_type.toLowerCase().includes(q) ||
        (r.service_description ?? '').toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [requests, filter, search])

  const counts = useMemo(() => {
    const c: Partial<Record<Filter, number>> = { All: requests.length }
    for (const f of FILTERS) {
      if (f !== 'All') c[f] = requests.filter((r) => r.status === f).length
    }
    return c
  }, [requests])

  // Totals reflect the current filter, matching the original behaviour.
  const totalAmount = filtered.reduce((sum, r) => sum + Number(r.amount), 0)
  const paidAmount = filtered
    .filter((r) => r.status === 'Paid' || r.status === 'Completed')
    .reduce((sum, r) => sum + Number(r.amount), 0)
  const dueAmount = filtered
    .filter((r) => r.status === 'Sent')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const isPayable = (r: MemberRequest) => r.status === 'Sent'

  const columns: Array<Column<MemberRequest>> = [
    {
      key: 'request_type',
      header: 'Request',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{r.request_type}</p>
          {r.service_description && (
            <p className="mt-0.5 truncate text-[13.5px] text-ink-3">{r.service_description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'requested_date',
      header: 'Requested for',
      sortable: true,
      secondary: true,
      cell: (r) => (
        <span className="tnum text-ink-2">
          {r.requested_date ? formatDate(r.requested_date) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      cell: (r) => <span className="tnum font-semibold text-ink">{formatCurrency(r.amount)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-2">
          {isPayable(r) && (
            <Button size="sm" onClick={() => onPay(r.id)}>
              Pay
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            icon={DownloadIcon}
            onClick={() => onDownloadInvoice(r)}
          >
            Invoice
          </Button>
        </div>
      ),
    },
  ]

  const mobileCard = (r: MemberRequest) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{r.request_type}</p>
          {r.service_description && (
            <p className="mt-0.5 text-[13.5px] leading-snug text-ink-3">
              {r.service_description}
            </p>
          )}
        </div>
        <StatusBadge status={r.status} />
      </div>
      <div className="flex items-center justify-between text-[14px]">
        <span className="tnum text-ink-2">
          {r.requested_date ? formatDate(r.requested_date) : '—'}
        </span>
        <span className="tnum font-serif text-[20px] text-ink">{formatCurrency(r.amount)}</span>
      </div>
      <div className="flex gap-2">
        {isPayable(r) && (
          <Button size="sm" fullWidth onClick={() => onPay(r.id)}>
            Pay {formatCurrency(r.amount)}
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          fullWidth
          icon={DownloadIcon}
          onClick={() => onDownloadInvoice(r)}
        >
          Invoice
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Your account"
        title="My requests"
        description="Service requests and invoices raised by the temple office."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total"
          value={formatCurrency(totalAmount)}
          caption={`${filtered.length} request${filtered.length === 1 ? '' : 's'}`}
          icon={ScrollTextIcon}
          tone="lotus"
        />
        <StatCard
          label="Paid"
          value={formatCurrency(paidAmount)}
          caption="Settled and completed"
          icon={ReceiptTextIcon}
          tone="tulsi"
        />
        <StatCard
          label="Due now"
          value={formatCurrency(dueAmount)}
          caption="Invoices awaiting payment"
          icon={ReceiptTextIcon}
          tone={dueAmount > 0 ? 'marigold' : 'sandal'}
        />
      </div>

      <FilterTabs
        label="Filter requests by status"
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        counts={counts}
      />

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by type or description…"
        summary={`${filtered.length} of ${requests.length} request${requests.length === 1 ? '' : 's'}`}
      />

      <DataTable
        caption="Your service requests"
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        mobileCard={mobileCard}
        loading={loading}
        empty={
          <EmptyState
            icon={ScrollTextIcon}
            title={
              requests.length === 0
                ? 'No requests yet'
                : 'Nothing matches those filters'
            }
            description={
              requests.length === 0
                ? 'When the temple office raises an invoice or a service request for you, it will appear here.'
                : 'Try a different status, or clear the search.'
            }
            action={
              requests.length > 0 ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFilter('All')
                    setSearch('')
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        }
      />
    </div>
  )
}
