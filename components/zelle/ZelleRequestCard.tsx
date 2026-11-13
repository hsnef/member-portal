'use client'

/**
 * One Zelle request, as the member sees it: how much, where to send it, the
 * reference for the memo, and what to do next ("I've sent it" / cancel).
 * Used at checkout and in the member's list of open payments.
 *
 * Contains no <form>: it is rendered inside the card checkout form.
 */

import { useState } from 'react'
import { CheckCircle2Icon, ClockIcon, CopyIcon, SendIcon, XIcon } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { formatCurrency, formatLongDate } from '@/utils/format'
import type { ZelleRecipientView, ZelleRequestView } from '@/lib/zelle/server'

export interface ZelleRequestCardProps {
  request: ZelleRequestView
  recipient: ZelleRecipientView
  onChange: (request: ZelleRequestView | null) => void
}

function CopyLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">{label}</p>
        <p className="tnum truncate text-[16px] font-semibold text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard?.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13.5px] font-semibold text-saffron hover:bg-saffron-soft"
      >
        <CopyIcon className="h-4 w-4" aria-hidden="true" />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export function ZelleRequestCard({ request, recipient, onChange }: ZelleRequestCardProps) {
  const [bankReference, setBankReference] = useState('')
  const [busy, setBusy] = useState<'sent' | 'cancel' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const owed = Math.round((request.amountDue - request.received) * 100) / 100

  const post = async (url: string, body: object) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Something went wrong; please try again')
    return data
  }

  const markSent = async () => {
    setBusy('sent')
    setError(null)
    try {
      const data = await post('/api/zelle/confirm-sent', { requestId: request.id, bankReference })
      onChange({ ...request, ...data.request, received: request.received })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const cancel = async () => {
    setBusy('cancel')
    setError(null)
    try {
      await post('/api/zelle/cancel', { requestId: request.id })
      onChange(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      {request.status === 'sent' && (
        <Alert tone="success" title="Thank you, the office has been told">
          {request.received > 0
            ? `${formatCurrency(request.received, true)} has arrived; ${formatCurrency(owed, true)} is still to pay.`
            : 'Your receipt is emailed as soon as the office sees the money arrive, usually within a couple of working days.'}
        </Alert>
      )}
      {request.status === 'not_received' && (
        <Alert tone="warning" title="The office could not find this payment">
          {request.closeReason || 'If you sent it, add your bank’s confirmation number below and press “I’ve sent it”.'}
        </Alert>
      )}

      <div className="rounded-2xl border border-line bg-surface-sunk p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[15px] text-ink-2">{request.description}</p>
          <p className="tnum font-serif text-[30px] leading-none text-ink">{formatCurrency(owed, true)}</p>
        </div>

        <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink-2">
          <li>
            <span className="font-semibold text-ink">1.</span> In your banking app, send it by Zelle to{' '}
            <span className="font-semibold text-ink">{recipient.recipientName}</span>:
          </li>
        </ol>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2.5">
            {recipient.email && <CopyLine label="Zelle email" value={recipient.email} />}
            {recipient.phone && <CopyLine label="Zelle phone" value={recipient.phone} />}
            <CopyLine label="2. Put this in the memo" value={request.referenceCode} />
          </div>
          {recipient.qrUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipient.qrUrl}
              alt="The temple's Zelle QR code: scan it with your banking app"
              className="h-40 w-40 rounded-xl border border-line bg-white p-2"
            />
          )}
        </div>
        {recipient.instructions && <p className="mt-3 text-[14px] text-ink-3">{recipient.instructions}</p>}
        <p className="mt-3 flex items-center gap-2 text-[13.5px] text-ink-3">
          <ClockIcon className="h-4 w-4" aria-hidden="true" />
          Please pay by {formatLongDate(request.expiresAt)}. These details were also emailed to you.
        </p>
      </div>

      {error && (
        <Alert tone="danger" title="That didn’t work">
          {error}
        </Alert>
      )}

      {request.status !== 'sent' ? (
        <div className="space-y-3">
          <p className="text-[15px] text-ink-2">
            <span className="font-semibold text-ink">3.</span> Once you have sent it, tell us:
          </p>
          <Field label="Your bank’s confirmation number" hint="Optional, but it helps the office find your payment.">
            {({ id }) => <Input id={id} className="tnum" value={bankReference} onChange={(e) => setBankReference(e.target.value)} />}
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button type="button" icon={SendIcon} loading={busy === 'sent'} onClick={markSent}>
              I’ve sent it
            </Button>
            {request.received === 0 && (
              <Button type="button" variant="ghost" icon={XIcon} loading={busy === 'cancel'} onClick={cancel}>
                Cancel this Zelle payment
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-[14px] text-ink-3">
          <CheckCircle2Icon className="h-4 w-4 text-tulsi" aria-hidden="true" />
          Marked as sent. Nothing else to do.
        </p>
      )}
    </div>
  )
}
