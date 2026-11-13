'use client'

/**
 * The member's Zelle payments that still need something: not yet sent, sent
 * and awaiting the office, or not found by the office. Renders nothing when
 * there are none. On the dashboard and on the Payments page.
 */

import { useEffect, useState } from 'react'
import { ChevronDownIcon, LandmarkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { ZelleRequestCard } from './ZelleRequestCard'
import { ZELLE_STATUS_LABEL } from '@/lib/zelle'
import { formatCurrency } from '@/utils/format'
import type { ZelleRecipientView, ZelleRequestView } from '@/lib/zelle/server'

export interface ZellePendingPaymentsProps {
  /** Kept for the callers' signature; the server reads the signed-in member. */
  memberId?: string
  compact?: boolean
}

export function ZellePendingPayments({ compact = false }: ZellePendingPaymentsProps) {
  const [requests, setRequests] = useState<ZelleRequestView[]>([])
  const [recipient, setRecipient] = useState<ZelleRecipientView | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/zelle/request/mine')
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((d) => {
        setRequests(d.requests ?? [])
        setRecipient(d.recipient ?? null)
      })
      .catch(() => setRequests([]))
  }, [])

  if (requests.length === 0 || !recipient) return null

  return (
    <section aria-label="Zelle payments in progress">
      <Card>
        <CardHeader
          title="Zelle payments in progress"
          description={compact ? undefined : 'Each one closes when the office confirms the money has arrived.'}
        />
        <ul className="divide-y divide-line">
          {requests.map((r) => {
            const open = openId === r.id
            return (
              <li key={r.id} className="py-3">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <LandmarkIcon className="h-5 w-5 shrink-0 text-tulsi" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink">{r.description}</span>
                    <span className="tnum block text-[13px] text-ink-3">
                      {r.referenceCode} · {formatCurrency(r.amountDue - r.received, true)}
                    </span>
                  </span>
                  <Badge tone={r.status === 'sent' ? 'tulsi' : r.status === 'not_received' ? 'marigold' : 'neutral'}>
                    {r.status === 'awaiting' ? 'To send' : ZELLE_STATUS_LABEL[r.status]}
                  </Badge>
                  <ChevronDownIcon className={`h-4 w-4 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {open && (
                  <div className="mt-4">
                    <ZelleRequestCard
                      request={r}
                      recipient={recipient}
                      onChange={(next) =>
                        setRequests((list) => (next ? list.map((x) => (x.id === r.id ? { ...x, ...next } : x)) : list.filter((x) => x.id !== r.id)))
                      }
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Card>
    </section>
  )
}
