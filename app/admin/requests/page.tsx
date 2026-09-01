'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AdminListView } from '@/components/admin/AdminListView'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { ScrollTextIcon, PlusIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'
import type { RequestStatus } from '@/types/design-system'

interface Request {
  id: string
  member_id: string
  membership_id: string
  request_type: string
  service_description: string
  requested_date: string
  amount: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Completed' | 'Cancelled'
  payment_id?: string
  notes?: string
  created_at: string
  member_name?: string
  member_email?: string
}

export default function RequestsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      // Fetch requests with member details
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          members:member_id (
            first_name,
            last_name,
            business_name,
            member_class,
            primary_email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data
      const transformedRequests = (data || []).map((req: any) => ({
        ...req,
        member_name: req.members?.member_class === 'Personal'
          ? `${req.members.first_name} ${req.members.last_name}`
          : req.members?.business_name || 'Unknown',
        member_email: req.members?.primary_email,
      }))

      setRequests(transformedRequests)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Array<Column<Request>> = [
    {
      key: 'member',
      header: 'Member',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{r.member_name ?? '—'}</p>
          <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">{r.membership_id}</p>
        </div>
      ),
    },
    {
      key: 'request_type',
      header: 'Request',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate text-ink">{r.request_type}</p>
          {r.service_description && (
            <p className="mt-0.5 truncate text-[13px] text-ink-3">{r.service_description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'requested_date',
      header: 'For',
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
      cell: (r) => <StatusBadge status={r.status as RequestStatus} />,
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
        <AppLink to={`/admin/requests/${r.id}`}>
          <Button size="sm" variant="secondary">
            Open
          </Button>
        </AppLink>
      ),
    },
  ]

  const mobileCard = (r: Request) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{r.request_type}</p>
          <p className="mt-0.5 truncate text-[13px] text-ink-3">{r.member_name ?? r.membership_id}</p>
        </div>
        <StatusBadge status={r.status as RequestStatus} />
      </div>
      <div className="flex items-center justify-between">
        <span className="tnum text-[13.5px] text-ink-2">
          {r.requested_date ? formatDate(r.requested_date) : '—'}
        </span>
        <span className="tnum font-serif text-[20px] text-ink">{formatCurrency(r.amount)}</span>
      </div>
    </div>
  )

  return (
    <AdminListView<Request>
      eyebrow="Office console"
      title="Requests"
      description="Service requests and the invoices raised against them."
      noun="request"
      actions={
        <AppLink to="/admin/requests/new">
          <Button icon={PlusIcon}>New request</Button>
        </AppLink>
      }
      rows={requests}
      columns={columns}
      rowKey={(r) => r.id}
      mobileCard={mobileCard}
      onRowClick={(r) => router.push(`/admin/requests/${r.id}`)}
      loading={loading}
      searchPlaceholder="Search by member, membership number or type…"
      searchFields={(r) => [r.membership_id, r.member_name, r.request_type]}
      /* Status filters CLIENT-side here, matching the original. */
      filters={['All', 'Draft', 'Sent', 'Paid', 'Completed', 'Cancelled']}
      filterValue={filterStatus}
      onFilterChange={setFilterStatus}
      filterFn={(r, f) => f === 'All' || r.status === f}
      emptyIcon={ScrollTextIcon}
      emptyTitle="No requests yet"
      emptyDescription="Raise a request to invoice a member for a service."
      emptyAction={
        <AppLink to="/admin/requests/new">
          <Button icon={PlusIcon}>Create the first request</Button>
        </AppLink>
      }
    />
  )
}
