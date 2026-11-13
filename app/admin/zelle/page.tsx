'use client'

/**
 * The office Zelle queue. Members' Zelle payments, newest work first:
 * "Member says sent" (check the bank, then confirm), "Awaiting payment",
 * "Not received", and the recently closed. For each: Confirm received (the
 * amount that actually arrived; short and over are handled), Not received,
 * or Cancel. Spec: docs/architecture/payments.md ("Zelle").
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckIcon, FileUpIcon, LandmarkIcon, SettingsIcon, XIcon } from 'lucide-react'
import { AdminListView } from '@/components/admin/AdminListView'
import { AppLink } from '@/components/nav/Nav'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import type { Column } from '@/components/ui/DataTable'
import { compareReceived, ZELLE_STATUS_LABEL } from '@/lib/zelle'
import { formatCurrency, formatDate } from '@/utils/format'
import type { QueueRow } from '@/lib/zelle/server'

const TABS = ['sent', 'awaiting', 'not_received', 'closed'] as const
type Tab = (typeof TABS)[number]
const TAB_LABEL: Record<Tab, string> = {
  sent: 'Member says sent',
  awaiting: 'Awaiting payment',
  not_received: 'Not received',
  closed: 'Closed',
}
const inTab = (r: QueueRow, tab: Tab) => (tab === 'closed' ? ['paid', 'cancelled', 'expired'].includes(r.status) : r.status === tab)
const owed = (r: QueueRow) => Math.round((Number(r.amount_due) - r.received) * 100) / 100
const money = (n: number) => formatCurrency(n, true)
const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'paid' ? 'success' : status === 'sent' ? 'tulsi' : status === 'not_received' ? 'warning' : 'neutral'
  return <Badge tone={tone}>{ZELLE_STATUS_LABEL[status] ?? status}</Badge>
}

export default function ZelleQueuePage() {
  const [rows, setRows] = useState<QueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('sent')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selected, setSelected] = useState<QueueRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/zelle/pending')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load the Zelle queue')
      setRows(data.requests)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, rows.filter((r) => inTab(r, t)).length])) as Record<Tab, number>, [rows])
  const waitingTotal = rows.filter((r) => r.status === 'sent').reduce((s, r) => s + owed(r), 0)

  const columns: Array<Column<QueueRow>> = [
    {
      key: 'member',
      header: 'Member',
      cell: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.member_name}</p>
          <p className="tnum text-[13px] text-ink-3">{r.membership_id}</p>
        </div>
      ),
    },
    { key: 'for', header: 'For', cell: (r) => <span className="text-ink-2">{r.description}</span> },
    { key: 'reference', header: 'Reference', cell: (r) => <span className="tnum font-semibold text-ink">{r.reference_code}</span> },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (r) => (
        <span className="tnum">
          {money(Number(r.amount_due))}
          {r.received > 0 && r.status !== 'paid' && <span className="block text-[12.5px] text-ink-3">{money(owed(r))} still due</span>}
        </span>
      ),
    },
    {
      key: 'when',
      header: 'Opened',
      secondary: true,
      cell: (r) => <span className="tnum text-ink-2">{formatDate(r.created_at)}</span>,
    },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <>
      <AdminListView<QueueRow>
        eyebrow="Payments"
        title="Zelle"
        description="Confirm members' Zelle payments once they show in the bank account. Each confirmation records the payment and emails the receipt."
        actions={
          <>
            <AppLink to="/admin/zelle/import">
              <Button variant="secondary" icon={FileUpIcon}>
                Upload bank file
              </Button>
            </AppLink>
            <AppLink to="/admin/zelle/settings">
              <Button variant="ghost" icon={SettingsIcon}>
                Settings
              </Button>
            </AppLink>
          </>
        }
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        onRowClick={(r) => {
          setNotice(null)
          setSelected(r)
        }}
        mobileCard={(r) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-ink">{r.member_name}</p>
              <p className="truncate text-[13.5px] text-ink-2">{r.description}</p>
              <p className="tnum text-[13px] text-ink-3">{r.reference_code}</p>
            </div>
            <div className="text-right">
              <p className="tnum font-semibold text-ink">{money(owed(r) > 0 ? owed(r) : Number(r.amount_due))}</p>
              <StatusBadge status={r.status} />
            </div>
          </div>
        )}
        loading={loading}
        searchFields={(r) => [r.member_name, r.membership_id, r.reference_code, r.description, r.member_bank_reference]}
        searchPlaceholder="Name, membership number, reference…"
        filters={TABS}
        filterValue={tab}
        onFilterChange={(v) => setTab(v as Tab)}
        filterLabels={Object.fromEntries(TABS.map((t) => [t, `${TAB_LABEL[t]} (${counts[t] ?? 0})`]))}
        filterFn={(r, f) => inTab(r, f as Tab)}
        emptyIcon={LandmarkIcon}
        emptyTitle={tab === 'sent' ? 'Nothing waiting to be checked' : 'Nothing here'}
        emptyDescription={
          tab === 'sent'
            ? 'When a member says they have sent a Zelle payment, it appears here (and the office alert list is emailed).'
            : 'Zelle payments in this state will appear here.'
        }
        noun="payment"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Member says sent" value={String(counts.sent ?? 0)} caption={`${money(waitingTotal)} to check`} icon={CheckIcon} tone="tulsi" />
          <StatCard label="Awaiting payment" value={String(counts.awaiting ?? 0)} caption="Not sent yet" icon={LandmarkIcon} tone="saffron" />
          <StatCard label="Not received" value={String(counts.not_received ?? 0)} caption="Member told; may pay again" icon={XIcon} tone="kumkum" />
        </div>
        {error && (
          <Alert tone="danger" title="Could not load the queue">
            {error}
          </Alert>
        )}
        {notice && (
          <Alert tone="success" title="Done">
            {notice}
          </Alert>
        )}
      </AdminListView>

      {selected && (
        <RequestPanel
          row={selected}
          onClose={() => setSelected(null)}
          onDone={(message) => {
            setSelected(null)
            setNotice(message)
            load()
          }}
        />
      )}
    </>
  )
}

function RequestPanel({ row, onClose, onDone }: { row: QueueRow; onClose: () => void; onDone: (message: string) => void }) {
  const [mode, setMode] = useState<'received' | 'not_received' | 'cancel'>('received')
  const [amount, setAmount] = useState(String(owed(row) > 0 ? owed(row) : row.amount_due))
  const [receivedOn, setReceivedOn] = useState(today())
  const [bankReference, setBankReference] = useState(row.member_bank_reference ?? '')
  const [extra, setExtra] = useState<'donation' | 'refund'>('donation')
  const [reason, setReason] = useState('')
  const [submissionId] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = ['awaiting', 'sent', 'not_received', 'expired'].includes(row.status)
  const moneyIn = row.received
  const allIn = moneyIn >= Number(row.amount_due) && row.status !== 'paid'
  const outcome = compareReceived(owed(row), Number(amount) || 0)

  const act = async (body: object, success: (d: Record<string, unknown>) => string) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(body && 'action' in body ? '/api/zelle/staff-confirm' : '/api/zelle/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: row.id, ...body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'That did not work')
      onDone(success(data))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const confirm = () =>
    act({ action: 'received', amount: Number(amount), receivedOn, bankReference, submissionId, extra }, (d) =>
      d.state === 'paid'
        ? `${row.member_name}: paid. Receipt ${d.receiptNumber} emailed.${d.extraReceipt ? ` The extra was recorded as a donation (${d.extraReceipt}).` : d.extra ? ` ${money(Number(d.extra))} extra to refund.` : ''}`
        : `${row.member_name}: ${money(Number(d.received))} recorded; ${money(Number(d.balance))} still due. They have been emailed.`,
    )

  const footer = !open ? undefined : allIn ? (
    <Button loading={busy} onClick={() => act({ action: 'finish', extra }, (d) => `${row.member_name}: paid. Receipt ${d.receiptNumber} emailed.`)}>
      Finish recording this payment
    </Button>
  ) : mode === 'received' ? (
    <Button icon={CheckIcon} loading={busy} disabled={!(Number(amount) > 0)} onClick={confirm}>
      Confirm {money(Number(amount) || 0)} received
    </Button>
  ) : mode === 'not_received' ? (
    <Button variant="danger" loading={busy} onClick={() => act({ action: 'not_received', reason }, () => `${row.member_name} has been told the payment was not found.`)}>
      Tell the member it was not received
    </Button>
  ) : (
    <Button variant="danger" loading={busy} onClick={() => act({ reason }, () => `${row.reference_code} cancelled.`)}>
      Cancel this request
    </Button>
  )

  return (
    <Modal open onClose={onClose} variant="panel" width="md" title={`${row.reference_code} · ${row.member_name}`} description={row.description} footer={footer}>
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14.5px]">
          <dt className="text-ink-3">Amount due</dt>
          <dd className="tnum text-right font-semibold text-ink">{money(Number(row.amount_due))}</dd>
          {moneyIn > 0 && (
            <>
              <dt className="text-ink-3">Received so far</dt>
              <dd className="tnum text-right text-ink">{money(moneyIn)}</dd>
            </>
          )}
          <dt className="text-ink-3">Status</dt>
          <dd className="text-right">
            <StatusBadge status={row.status} />
          </dd>
          {row.member_sent_at && (
            <>
              <dt className="text-ink-3">Member says sent</dt>
              <dd className="text-right text-ink">{formatDate(row.member_sent_at)}</dd>
            </>
          )}
          {row.member_bank_reference && (
            <>
              <dt className="text-ink-3">Their bank confirmation</dt>
              <dd className="tnum text-right text-ink">{row.member_bank_reference}</dd>
            </>
          )}
          {row.close_reason && (
            <>
              <dt className="text-ink-3">Note</dt>
              <dd className="text-right text-ink-2">{row.close_reason}</dd>
            </>
          )}
        </dl>

        {error && (
          <Alert tone="danger" title="That did not work">
            {error}
          </Alert>
        )}

        {!open ? (
          <p className="text-[14.5px] text-ink-3">This request is closed.</p>
        ) : allIn ? (
          <Alert tone="warning" title="The money is all in">
            The full amount has been recorded but the payment was not finished (it may have failed earlier). Finish it to mark the item paid and email the receipt.
          </Alert>
        ) : (
          <>
            <Field label="What do you want to do?">
              {({ id }) => (
                <Select id={id} value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
                  <option value="received">Confirm money received</option>
                  {moneyIn === 0 && <option value="not_received">It has not arrived</option>}
                  {moneyIn === 0 && <option value="cancel">Cancel the request</option>}
                </Select>
              )}
            </Field>

            {mode === 'received' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount that arrived" required hint={`${money(owed(row))} is due.`}>
                  {({ id }) => <Input id={id} type="number" min="0.01" step="0.01" className="tnum" value={amount} onChange={(e) => setAmount(e.target.value)} />}
                </Field>
                <Field label="Date it arrived">
                  {({ id }) => <Input id={id} type="date" value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} />}
                </Field>
                <Field label="Bank confirmation number" className="sm:col-span-2">
                  {({ id }) => <Input id={id} className="tnum" value={bankReference} onChange={(e) => setBankReference(e.target.value)} />}
                </Field>
                {outcome.kind === 'short' && (
                  <div className="sm:col-span-2">
                    <Alert tone="warning" title={`${money(outcome.balance)} short`}>
                      This is recorded as part of the payment. The member is emailed to send the rest with the same reference; it is not marked paid until the full amount is in.
                    </Alert>
                  </div>
                )}
                {outcome.kind === 'over' && (
                  <Field label={`${money(outcome.extra)} more than due`} className="sm:col-span-2">
                    {({ id }) => (
                      <Select id={id} value={extra} onChange={(e) => setExtra(e.target.value as typeof extra)}>
                        <option value="donation">Record the extra as a donation (General Temple Fund)</option>
                        <option value="refund">The office will refund it (outside the portal)</option>
                      </Select>
                    )}
                  </Field>
                )}
              </div>
            ) : (
              <Field label={mode === 'not_received' ? 'Message for the member (optional)' : 'Reason (optional)'}>
                {({ id }) => <Textarea id={id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}
              </Field>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
