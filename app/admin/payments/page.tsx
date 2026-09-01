'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { ToolbarFilter } from '@/components/ui/Toolbar'
import { AppLink } from '@/components/nav/Nav'
import { CreditCardIcon, PlusIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'
import type { PaymentPurpose, PaymentMethod } from '@/types/database'
import { useTestData } from '@/lib/context/TestDataContext'
import { getTestMemberIds } from '@/lib/utils/testDataFiltering'

interface Payment {
  id: string
  member_id: string
  membership_id: string
  amount: number
  payment_date: string
  method: PaymentMethod
  purpose: PaymentPurpose
  check_number?: string
  zelle_reference?: string
  stripe_payment_intent_id?: string
  notes?: string
  member_name?: string
  member_email?: string
  is_test_payment?: boolean
}

export default function PaymentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showTestData } = useTestData()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPurpose, setFilterPurpose] = useState<PaymentPurpose | 'All'>('All')
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'All'>('All')

  useEffect(() => {
    fetchPayments()
  }, [showTestData])

  const fetchPayments = async () => {
    try {
      // Get test member IDs for filtering
      const testMemberIds = await getTestMemberIds()

      // Fetch payments with member details
      let query = supabase
        .from('payments')
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
        .order('payment_date', { ascending: false })
        .limit(100)

      // Filter out test payments unless showTestData toggle is ON
      if (!showTestData && testMemberIds.length > 0) {
        query = query.not('member_id', 'in', `(${testMemberIds.join(',')})`)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data to include member name and test flag
      const transformedPayments = data?.map((payment: any) => ({
        ...payment,
        member_name: payment.members?.member_class === 'Personal'
          ? `${payment.members.first_name} ${payment.members.last_name}`
          : payment.members?.business_name || 'Unknown',
        member_email: payment.members?.primary_email,
        is_test_payment: testMemberIds.includes(payment.member_id),
      })) || []

      setPayments(transformedPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      searchQuery === '' ||
      payment.membership_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.member_email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPurpose = filterPurpose === 'All' || payment.purpose === filterPurpose
    const matchesMethod = filterMethod === 'All' || payment.method === filterMethod

    return matchesSearch && matchesPurpose && matchesMethod
  })

  // Calculate totals
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)

  const purposeTone: Record<string, 'tulsi' | 'kumkum' | 'marigold' | 'copper' | 'neutral'> = {
    Donation: 'tulsi',
    Membership: 'kumkum',
    Event: 'marigold',
    Service: 'copper',
  }

  const reference = (p: Payment) =>
    p.check_number || p.zelle_reference || p.stripe_payment_intent_id?.slice(-8) || '—'

  const columns: Array<Column<Payment>> = [
    {
      key: 'member',
      header: 'Member',
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{p.member_name ?? '—'}</p>
          <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">{p.membership_id}</p>
        </div>
      ),
    },
    {
      key: 'payment_date',
      header: 'Date',
      sortable: true,
      cell: (p) => <span className="tnum text-ink-2">{formatDate(p.payment_date)}</span>,
    },
    {
      key: 'purpose',
      header: 'Purpose',
      cell: (p) => <Badge tone={purposeTone[String(p.purpose)] ?? 'neutral'}>{p.purpose}</Badge>,
    },
    {
      key: 'method',
      header: 'Method',
      secondary: true,
      cell: (p) => (
        <div className="min-w-0">
          <p className="text-ink-2">{p.method}</p>
          <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">{reference(p)}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      cell: (p) => (
        <span className="tnum font-semibold text-ink">{formatCurrency(p.amount, true)}</span>
      ),
    },
  ]

  const mobileCard = (p: Payment) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{p.member_name ?? p.membership_id}</p>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">
            {formatDate(p.payment_date)} · {p.method}
          </p>
        </div>
        <Badge tone={purposeTone[String(p.purpose)] ?? 'neutral'}>{p.purpose}</Badge>
      </div>
      <p className="tnum font-serif text-[20px] text-ink">{formatCurrency(p.amount, true)}</p>
    </div>
  )

  return (
    <AdminListView<Payment>
      eyebrow="Office console"
      title="Payments"
      description="Every payment recorded against a membership."
      noun="payment"
      actions={
        <AppLink to="/admin/payments/new">
          <Button icon={PlusIcon}>Record payment</Button>
        </AppLink>
      }
      rows={payments}
      columns={columns}
      rowKey={(p) => p.id}
      mobileCard={mobileCard}
      loading={loading}
      searchPlaceholder="Search by member, membership number or email…"
      searchFields={(p) => [p.membership_id, p.member_name, p.member_email]}
      filters={['All', 'Donation', 'Membership', 'Event', 'Service']}
      filterValue={filterPurpose}
      onFilterChange={(v) => setFilterPurpose(v as PaymentPurpose | 'All')}
      filterFn={(p, f) => f === 'All' || p.purpose === f}
      toolbarFilters={
        <ToolbarFilter
          label="Method"
          value={filterMethod}
          onChange={(v) => setFilterMethod(v as PaymentMethod | 'All')}
          options={['All', 'Card', 'Check', 'Cash', 'Zelle']}
        />
      }
      emptyIcon={CreditCardIcon}
      emptyTitle="No payments recorded"
      emptyDescription="Record a payment taken by cash, check or Zelle at the office."
      emptyAction={
        <AppLink to="/admin/payments/new">
          <Button icon={PlusIcon}>Record the first payment</Button>
        </AppLink>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total recorded"
          value={formatCurrency(totalAmount)}
          caption={`${filteredPayments.length} payment${filteredPayments.length === 1 ? '' : 's'} shown`}
          icon={CreditCardIcon}
          tone="tulsi"
        />
        <StatCard
          label="All payments"
          value={String(payments.length)}
          caption="Before filters"
          icon={CreditCardIcon}
          tone="sandal"
        />
      </div>
    </AdminListView>
  )
}
