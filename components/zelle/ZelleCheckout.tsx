'use client'

/**
 * "Pay with Zelle instead", for any checkout. Given WHAT is being paid for
 * (the same item a card checkout sends), it opens a Zelle request priced by
 * the server and shows the member how to pay. When Zelle is not available,
 * it shows how to pay at the office instead.
 *
 * Contains no <form>: it is rendered inside the card checkout form.
 */

import { useEffect, useState } from 'react'
import { LandmarkIcon } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ZelleRequestCard } from './ZelleRequestCard'
import type { CheckoutItem } from '@/lib/payments/checkout'
import type { ZelleRecipientView, ZelleRequestView } from '@/lib/zelle/server'

export interface ZelleCheckoutProps {
  item: CheckoutItem | null
  /** Shown when Zelle is not offered (e.g. the booking number to bring). */
  officeReference?: string | null
}

export function ZelleCheckout({ item, officeReference }: ZelleCheckoutProps) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [recipient, setRecipient] = useState<ZelleRecipientView | null>(null)
  const [request, setRequest] = useState<ZelleRequestView | null>(null)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/zelle/settings')
      .then((r) => r.json())
      .then((d) => {
        setAvailable(!!d.available)
        setRecipient(d.recipient)
      })
      .catch(() => setAvailable(false))
  }, [])

  const open = async () => {
    if (!item) return
    setOpening(true)
    setError(null)
    try {
      const res = await fetch('/api/zelle/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not start the Zelle payment')
      setRequest(data.request)
      setRecipient(data.recipient)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOpening(false)
    }
  }

  if (available === false || !item) {
    return (
      <p className="text-[15px] leading-relaxed text-ink-2">
        You can pay by cheque, cash or Zelle at the temple office.
        {officeReference ? (
          <>
            {' '}Mention <span className="tnum font-semibold text-ink">{officeReference}</span> and the desk will record it.
          </>
        ) : (
          ' The desk will record it for you.'
        )}
      </p>
    )
  }

  if (request && recipient) {
    return <ZelleRequestCard request={request} recipient={recipient} onChange={setRequest} />
  }

  return (
    <div className="space-y-4">
      <p className="text-[15px] leading-relaxed text-ink-2">
        Send it from your own bank with Zelle: no card needed and no fees. We give you a reference to put in the
        memo, and email your receipt when the money arrives.
      </p>
      {error && (
        <Alert tone="danger" title="Zelle isn’t available for this">
          {error}
        </Alert>
      )}
      <Button type="button" variant="secondary" icon={LandmarkIcon} loading={opening || available === null} onClick={open}>
        Pay with Zelle instead
      </Button>
    </div>
  )
}
