'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { ToolbarFilter } from '@/components/ui/Toolbar'
import { ReceiptTextIcon, DownloadIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'
import { downloadReceipt } from '@/lib/pdf/receipt'
import type { PaymentCategory, PaymentMethod } from '@/types/database'

interface Payment {
  id: string
  member_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  category: PaymentCategory
  check_number?: string
  transaction_id?: string
  stripe_payment_id?: string
  notes?: string
  members: {
    membership_id: string
    first_name: string
    last_name: string
    business_name?: string
    member_class: string
    primary_email?: string
    address_line_1?: string
    city?: string
    state?: string
    zip?: string
    is_test_account: boolean
  }
}

export default function AdminReceiptsPage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [filterCategory, setFilterCategory] = useState<'all' | PaymentCategory>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [includeTestAccounts, setIncludeTestAccounts] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [filterYear, filterCategory, includeTestAccounts])

  const fetchPayments = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('payments')
        .select(`
          *,
          members (
            membership_id,
            first_name,
            last_name,
            business_name,
            member_class,
            primary_email,
            address_line_1,
            city,
            state,
            zip,
            is_test_account
          )
        `)
        .order('payment_date', { ascending: false })

      // Filter by year
      const startDate = `${filterYear}-01-01`
      const endDate = `${filterYear}-12-31`
      query = query.gte('payment_date', startDate).lte('payment_date', endDate)

      // Filter by category
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter out test accounts unless explicitly included
      let filteredData = data || []
      if (!includeTestAccounts) {
        filteredData = filteredData.filter(p => !p.members?.is_test_account)
      }

      setPayments(filteredData)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = (payment: Payment) => {
    const member = payment.members
    if (!member) return

    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name || `${member.first_name} ${member.last_name}`

    downloadReceipt({
      receiptNumber: `R-${payment.id.slice(0, 8).toUpperCase()}`,
      paymentId: payment.id,
      memberName,
      membershipId: member.membership_id,
      memberEmail: member.primary_email,
      memberAddress: member.address_line_1
        ? `${member.address_line_1}, ${member.city}, ${member.state} ${member.zip}`
        : undefined,
      amount: payment.amount,
      paymentDate: payment.payment_date,
      paymentMethod: payment.payment_method,
      category: payment.category,
      checkNumber: payment.check_number,
      transactionId: payment.transaction_id,
      notes: payment.notes,
    })
  }

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      payment.members?.membership_id.toLowerCase().includes(search) ||
      payment.members?.first_name.toLowerCase().includes(search) ||
      payment.members?.last_name.toLowerCase().includes(search) ||
      payment.members?.business_name?.toLowerCase().includes(search) ||
      payment.id.toLowerCase().includes(search)
    )
  })

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)

  const memberName = (p: Payment) =>
    p.members?.member_class === 'Business'
      ? p.members?.business_name || '—'
      : [p.members?.first_name, p.members?.last_name].filter(Boolean).join(' ') || '—'

  const categoryTone: Record<string, 'tulsi' | 'kumkum' | 'marigold' | 'copper' | 'neutral'> = {
    Donation: 'tulsi',
    Membership: 'kumkum',
    Event: 'marigold',
    Service: 'copper',
  }

  const thisYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 6 }, (_, i) => thisYear - i)

  const columns: Array<Column<Payment>> = [
    {
      key: 'member',
      header: 'Member',
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{memberName(p)}</p>
          <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">
            {p.members?.membership_id}
          </p>
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
      key: 'category',
      header: 'Category',
      cell: (p) => (
        <Badge tone={categoryTone[String(p.category)] ?? 'neutral'}>{p.category}</Badge>
      ),
    },
    {
      key: 'receipt',
      header: 'Receipt',
      secondary: true,
      cell: (p) => (
        <span className="tnum text-ink-3">R-{p.id.slice(0, 8).toUpperCase()}</span>
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
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (p) => (
        <Button
          size="sm"
          variant="secondary"
          icon={DownloadIcon}
          onClick={() => handleDownloadReceipt(p)}
        >
          Receipt
        </Button>
      ),
    },
  ]

  const mobileCard = (p: Payment) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{memberName(p)}</p>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">{formatDate(p.payment_date)}</p>
        </div>
        <Badge tone={categoryTone[String(p.category)] ?? 'neutral'}>{p.category}</Badge>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="tnum font-serif text-[20px] text-ink">
          {formatCurrency(p.amount, true)}
        </span>
        <Button
          size="sm"
          variant="secondary"
          icon={DownloadIcon}
          onClick={() => handleDownloadReceipt(p)}
        >
          Receipt
        </Button>
      </div>
    </div>
  )

  return (
    <AdminListView<Payment>
      eyebrow="Office console"
      title="Receipts"
      description="Issued tax receipts, downloadable as PDF for any member."
      noun="receipt"
      rows={payments}
      columns={columns}
      rowKey={(p) => p.id}
      mobileCard={mobileCard}
      loading={loading}
      searchPlaceholder="Search by member, membership number or receipt..."
      searchFields={(p) => [
        p.members?.membership_id,
        p.members?.first_name,
        p.members?.last_name,
        p.members?.business_name,
        p.id,
      ]}
      filters={['all', 'Donation', 'Membership', 'Event', 'Service']}
      filterLabels={{ all: 'All' }}
      filterValue={filterCategory}
      onFilterChange={(v) => setFilterCategory(v as typeof filterCategory)}
      toolbarFilters={
        <ToolbarFilter
          label="Year"
          value={String(filterYear)}
          onChange={(v) => setFilterYear(Number(v))}
          options={availableYears.map(String)}
        />
      }
      emptyIcon={ReceiptTextIcon}
      emptyTitle={`No receipts in ${filterYear}`}
      emptyDescription="Receipts are generated from recorded payments. Record a payment to issue one."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={`Receipted in ${filterYear}`}
          value={formatCurrency(totalAmount)}
          caption={`${filteredPayments.length} receipt${filteredPayments.length === 1 ? '' : 's'}`}
          icon={ReceiptTextIcon}
          tone="sandal"
        />
        <StatCard
          label="All receipts"
          value={String(payments.length)}
          caption="Before filters"
          icon={ReceiptTextIcon}
          tone="tulsi"
        />
      </div>
    </AdminListView>
  )
}
