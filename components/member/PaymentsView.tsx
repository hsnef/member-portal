'use client'

/**
 * Payments ledger — presentation only.
 *
 * app/member/payments/page.tsx owns the Supabase query, the receipt PDF
 * generation, the CSV export and the combined-receipts PDF.
 *
 * Exemplar: design-kit/pages/Payments.tsx (ledger / receipts archetype)
 */

import React, { useMemo, useState } from 'react'
import {
  CalendarDaysIcon,
  DownloadIcon,
  FileTextIcon,
  FlameIcon,
  HandCoinsIcon,
  HeartHandshakeIcon,
  IdCardIcon,
  ReceiptTextIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconTile } from '@/components/ui/IconTile'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Toolbar, ToolbarFilter } from '@/components/ui/Toolbar'
import { ZellePendingPayments } from '@/components/zelle/ZellePendingPayments'
import { formatCurrency, formatDate } from '@/utils/format'
import type { PaymentMethod, PaymentPurpose } from '@/types/database'
import type { Tone } from '@/utils/tones'

export interface MemberPayment {
  id: string
  amount: number
  payment_date: string
  method: PaymentMethod
  purpose: PaymentPurpose
  check_number?: string
  zelle_reference?: string
  stripe_payment_intent_id?: string
  notes?: string
}

/** Each purpose owns a hue, so the ledger is scannable by category. */
const purposeTone: Record<string, Tone> = {
  Donation: 'tulsi',
  Membership: 'kumkum',
  Event: 'marigold',
  Service: 'copper',
}

const purposeIcon: Record<string, typeof FlameIcon> = {
  Donation: HandCoinsIcon,
  Membership: IdCardIcon,
  Event: CalendarDaysIcon,
  Service: FlameIcon,
}

export interface PaymentsViewProps {
  memberId: string
  payments: MemberPayment[]
  loading: boolean
  year: number
  availableYears: number[]
  onYearChange: (year: number) => void
  totalPaid: number
  donationsTotal: number
  onDownloadReceipt: (payment: MemberPayment) => void
  onExportCsv: () => void
  onDownloadAllReceipts: () => void
}

export function PaymentsView({
  memberId,
  payments,
  loading,
  year,
  availableYears,
  onYearChange,
  totalPaid,
  donationsTotal,
  onDownloadReceipt,
  onExportCsv,
  onDownloadAllReceipts,
}: PaymentsViewProps) {
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return payments
    return payments.filter(
      (p) =>
        String(p.purpose).toLowerCase().includes(q) ||
        String(p.method).toLowerCase().includes(q) ||
        (p.notes ?? '').toLowerCase().includes(q) ||
        (p.check_number ?? '').toLowerCase().includes(q)
    )
  }, [payments, search])

  const reference = (p: MemberPayment) =>
    p.check_number || p.zelle_reference || p.stripe_payment_intent_id?.slice(-8) || '—'

  const columns: Array<Column<MemberPayment>> = [
    {
      key: 'purpose',
      header: 'Payment',
      cell: (p) => {
        const Icon = purposeIcon[String(p.purpose)] ?? ReceiptTextIcon
        return (
          <div className="flex min-w-0 items-center gap-3">
            <IconTile icon={Icon} tone={purposeTone[String(p.purpose)] ?? 'sandal'} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{p.purpose}</p>
              {p.notes && <p className="mt-0.5 truncate text-[13px] text-ink-3">{p.notes}</p>}
            </div>
          </div>
        )
      },
    },
    {
      key: 'payment_date',
      header: 'Date',
      sortable: true,
      cell: (p) => <span className="tnum text-ink-2">{formatDate(p.payment_date)}</span>,
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
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            icon={DownloadIcon}
            onClick={() => onDownloadReceipt(p)}
          >
            Receipt
          </Button>
        </div>
      ),
    },
  ]

  const mobileCard = (p: MemberPayment) => {
    const Icon = purposeIcon[String(p.purpose)] ?? ReceiptTextIcon
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <IconTile icon={Icon} tone={purposeTone[String(p.purpose)] ?? 'sandal'} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{p.purpose}</p>
              <p className="tnum mt-0.5 text-[13px] text-ink-3">
                {formatDate(p.payment_date)} · {p.method}
              </p>
            </div>
          </div>
          <span className="tnum shrink-0 font-serif text-[20px] text-ink">
            {formatCurrency(p.amount, true)}
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          fullWidth
          icon={DownloadIcon}
          onClick={() => onDownloadReceipt(p)}
        >
          Download receipt
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Your account"
        title="Payments & receipts"
        description="Every payment you have made to the temple, with a receipt for each."
        actions={
          payments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={FileTextIcon} onClick={onExportCsv}>
                Export CSV
              </Button>
              <Button variant="secondary" icon={DownloadIcon} onClick={onDownloadAllReceipts}>
                All receipts
              </Button>
            </div>
          ) : undefined
        }
      />

      <ZellePendingPayments memberId={memberId} compact />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={`Paid in ${year}`}
          value={formatCurrency(totalPaid)}
          caption={`${payments.length} payment${payments.length === 1 ? '' : 's'}`}
          icon={ReceiptTextIcon}
          tone="sandal"
        />
        <StatCard
          label={`Donations in ${year}`}
          value={formatCurrency(donationsTotal)}
          caption="Tax deductible"
          icon={HeartHandshakeIcon}
          tone="tulsi"
        />
      </div>

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by category, method or note…"
        summary={`${rows.length} payment${rows.length === 1 ? '' : 's'} in ${year}`}
        filters={
          availableYears.length > 1 ? (
            <ToolbarFilter
              label="Year"
              value={String(year)}
              onChange={(v) => onYearChange(Number(v))}
              options={availableYears.map(String)}
            />
          ) : undefined
        }
      />

      <DataTable
        caption={`Your payments in ${year}`}
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        mobileCard={mobileCard}
        loading={loading}
        empty={
          <EmptyState
            icon={ReceiptTextIcon}
            title={`No payments in ${year}`}
            description={
              availableYears.length > 1
                ? 'Try a different year, or clear the search.'
                : 'Payments you make to the temple will appear here, each with a downloadable receipt.'
            }
          />
        }
      />

      {donationsTotal > 0 && (
        <Card tone="sunk" spine="tulsi" className="pl-7">
          <div className="flex items-start gap-3">
            <HeartHandshakeIcon
              className="mt-0.5 h-5 w-5 shrink-0 text-tulsi"
              aria-hidden="true"
            />
            <p className="text-[14.5px] leading-relaxed text-ink-2">
              Your donations of{' '}
              <span className="tnum font-semibold text-ink">
                {formatCurrency(donationsTotal, true)}
              </span>{' '}
              in {year} are tax deductible. HSNEF is a registered 501(c)(3) — keep these receipts
              for your records.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
