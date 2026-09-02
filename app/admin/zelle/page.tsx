'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatAmount, getTimeRemaining, getStatusLabel, getStatusColor } from '@/lib/zelle'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { Alert } from '@/components/ui/Alert'
import { AppLink } from '@/components/nav/Nav'
import { WalletIcon, CheckIcon, SettingsIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'

interface ZelleRequestWithMember {
  id: string
  reference_code: string
  amount: number
  purpose: string
  description: string | null
  status: string
  member_confirmed_at: string | null
  member_zelle_reference: string | null
  expires_at: string
  created_at: string
  members?: {
    id: string
    membership_id: string
    first_name: string | null
    last_name: string | null
    business_name: string | null
    member_class: string
    primary_email: string
  } | null
}

export default function ZelleAdminPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ZelleRequestWithMember[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'member_confirmed'>('all')

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/zelle/pending')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch requests')
        return
      }

      setRequests(data.requests || [])
    } catch {
      setError('Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    // Refresh every 30 seconds
    const interval = setInterval(fetchRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleConfirm = async (reference: string) => {
    setConfirming(reference)

    try {
      const response = await fetch('/api/zelle/staff-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to confirm payment')
        return
      }

      // Remove from list
      setRequests(prev => prev.filter(r => r.reference_code !== reference))
      alert('Payment confirmed successfully!')
    } catch {
      alert('Failed to confirm payment')
    } finally {
      setConfirming(null)
    }
  }

  const getMemberName = (member: ZelleRequestWithMember['members']) => {
    if (!member) return 'Walk-in'
    return member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true
    return req.status === filter
  })

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const awaitingConfirmCount = requests.filter(r => r.status === 'member_confirmed').length

  const zelleMemberName = (r: ZelleRequestWithMember) =>
    r.members?.member_class === 'Business'
      ? r.members?.business_name || '\—'
      : [r.members?.first_name, r.members?.last_name].filter(Boolean).join(' ') || '\—'

  const statusTone: Record<string, 'marigold' | 'saffron' | 'tulsi' | 'neutral'> = {
    pending: 'marigold',
    member_confirmed: 'saffron',
    confirmed: 'tulsi',
    cancelled: 'neutral',
  }

  const statusLabel: Record<string, string> = {
    pending: 'Awaiting transfer',
    member_confirmed: 'Member says sent',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  }

  const columns: Array<Column<ZelleRequestWithMember>> = [
    {
      key: 'member',
      header: 'Member',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{zelleMemberName(r)}</p>
          <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">
            {r.members?.membership_id ?? ''}
          </p>
        </div>
      ),
    },
    {
      key: 'reference_code',
      header: 'Reference',
      cell: (r) => <span className="tnum text-ink-2">{r.reference_code}</span>,
    },
    {
      key: 'purpose',
      header: 'Purpose',
      secondary: true,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate text-ink-2">{r.purpose}</p>
          {r.member_zelle_reference && (
            <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">
              Their ref: {r.member_zelle_reference}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge tone={statusTone[r.status] ?? 'neutral'}>
          {statusLabel[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      cell: (r) => (
        <span className="tnum font-semibold text-ink">{formatCurrency(r.amount, true)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) =>
        r.status === 'member_confirmed' ? (
          <Button
            size="sm"
            icon={CheckIcon}
            loading={confirming === r.reference_code}
            onClick={() => handleConfirm(r.reference_code)}
          >
            Mark received
          </Button>
        ) : null,
    },
  ]

  const mobileCard = (r: ZelleRequestWithMember) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{zelleMemberName(r)}</p>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">{r.reference_code}</p>
        </div>
        <Badge tone={statusTone[r.status] ?? 'neutral'}>
          {statusLabel[r.status] ?? r.status}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="tnum font-serif text-[20px] text-ink">
          {formatCurrency(r.amount, true)}
        </span>
        {r.status === 'member_confirmed' && (
          <Button
            size="sm"
            icon={CheckIcon}
            loading={confirming === r.reference_code}
            onClick={() => handleConfirm(r.reference_code)}
          >
            Mark received
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <AdminListView<ZelleRequestWithMember>
      eyebrow="Office console"
      title="Zelle payments"
      description="Members transfer directly to the temple. Confirm each one against the bank."
      noun="request"
      actions={
        <AppLink to="/admin/zelle/settings">
          <Button variant="secondary" icon={SettingsIcon}>
            Zelle settings
          </Button>
        </AppLink>
      }
      rows={requests}
      columns={columns}
      rowKey={(r) => r.id}
      mobileCard={mobileCard}
      loading={loading}
      searchPlaceholder="Search by member, reference or purpose..."
      searchFields={(r) => [
        zelleMemberName(r),
        r.members?.membership_id,
        r.reference_code,
        r.purpose,
        r.member_zelle_reference,
      ]}
      filters={['all', 'pending', 'member_confirmed']}
      filterLabels={{
        all: 'All',
        pending: 'Awaiting transfer',
        member_confirmed: 'Member says sent',
      }}
      filterValue={filter}
      onFilterChange={(v) => setFilter(v as typeof filter)}
      filterFn={(r, f) => f === 'all' || r.status === f}
      emptyIcon={WalletIcon}
      emptyTitle="No Zelle requests"
      emptyDescription="When a member chooses Zelle at checkout, their request appears here for confirmation."
    >
      {error && (
        <Alert tone="danger" title="That didn't work">
          {error}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Member says sent"
          value={String(awaitingConfirmCount)}
          caption="Waiting on the office to confirm"
          icon={CheckIcon}
          tone={awaitingConfirmCount > 0 ? 'marigold' : 'sandal'}
        />
        <StatCard
          label="Awaiting transfer"
          value={String(pendingCount)}
          caption="Member has not sent yet"
          icon={WalletIcon}
          tone="sandal"
        />
      </div>
    </AdminListView>
  )
}
