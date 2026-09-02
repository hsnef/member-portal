'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ZellePaymentQR } from '@/components/zelle/ZellePaymentQR'
import { formatAmount } from '@/lib/zelle'
import type { PaymentPurpose } from '@/types/database'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { AppLink } from '@/components/nav/Nav'
import { formatCurrency } from '@/utils/format'
import { QrCodeIcon, MaximizeIcon, MinimizeIcon, CheckIcon, XIcon } from 'lucide-react'

interface ActiveRequest {
  reference_code: string
  amount: number
  purpose: string
  qrCode: string
  paymentUrl: string
  status: string
  expires_at: string
}

export default function QuickPayPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState<PaymentPurpose>('Donation')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  // Poll for status updates when request is active
  useEffect(() => {
    if (!activeRequest) return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/zelle/request/${activeRequest.reference_code}`)
        const data = await response.json()

        if (data.request?.status === 'member_confirmed') {
          // Member confirmed, show confirmation needed
          setActiveRequest(prev => prev ? { ...prev, status: 'member_confirmed' } : null)
        } else if (data.request?.status === 'auto_confirmed' || data.request?.status === 'staff_confirmed') {
          // Payment complete
          alert('Payment confirmed!')
          setActiveRequest(null)
        }
      } catch {
        // Ignore polling errors
      }
    }

    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [activeRequest])

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/zelle/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          purpose,
          description: description || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create payment request')
        return
      }

      setActiveRequest({
        reference_code: data.request.reference_code,
        amount: data.request.amount,
        purpose: data.request.purpose,
        qrCode: data.qrCode,
        paymentUrl: data.paymentUrl,
        status: data.request.status,
        expires_at: data.request.expires_at,
      })
    } catch {
      setError('Failed to create payment request')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!activeRequest) return

    try {
      await fetch('/api/zelle/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: activeRequest.reference_code }),
      })
    } catch {
      // Ignore
    }

    setActiveRequest(null)
    setAmount('')
    setDescription('')
  }

  const handleConfirm = async () => {
    if (!activeRequest) return

    try {
      const response = await fetch('/api/zelle/staff-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: activeRequest.reference_code }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to confirm')
        return
      }

      alert('Payment confirmed!')
      setActiveRequest(null)
      setAmount('')
      setDescription('')
    } catch {
      alert('Failed to confirm payment')
    }
  }

  // Fullscreen QR display
  /* Fullscreen: the screen is turned toward the member at the desk, so it
     shows only the code and the amount. */
  if (fullscreen && activeRequest) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas p-8">
        <Button
          variant="ghost"
          icon={MinimizeIcon}
          onClick={() => setFullscreen(false)}
          className="absolute right-6 top-6"
        >
          Exit fullscreen
        </Button>

        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">
          Scan to pay by Zelle
        </p>
        <p className="tnum mt-3 font-serif text-[56px] leading-none text-ink">
          {formatCurrency(activeRequest.amount, true)}
        </p>

        <div className="mt-8">
          <ZellePaymentQR
            referenceCode={activeRequest.reference_code}
            amount={activeRequest.amount}
            purpose={activeRequest.purpose}
            size={320}
          />
        </div>

        <p className="tnum mt-8 text-[20px] font-semibold text-ink">
          {activeRequest.reference_code}
        </p>
        <p className="mt-1 text-[15px] text-ink-2">
          Include this reference in the Zelle memo.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Zelle"
        title="Quick pay at the desk"
        description="Create a payment request and turn the screen around for the member to scan."
        actions={
          <AppLink to="/admin/zelle">
            <Button variant="secondary">Back to the queue</Button>
          </AppLink>
        }
      />

      {error && (
        <Alert tone="danger" title="That didn't work">
          {error}
        </Alert>
      )}

      {activeRequest ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
          <Card spine="tulsi" className="pl-7 text-center">
            <CardHeader title="Ready to scan" />
            <p className="tnum font-serif text-[40px] leading-none text-ink">
              {formatCurrency(activeRequest.amount, true)}
            </p>
            <p className="mt-1 text-[14.5px] text-ink-2">{activeRequest.purpose}</p>

            <div className="mt-6 flex justify-center">
              <ZellePaymentQR
                referenceCode={activeRequest.reference_code}
                amount={activeRequest.amount}
                purpose={activeRequest.purpose}
                size={220}
              />
            </div>

            <p className="tnum mt-5 text-[18px] font-semibold text-ink">
              {activeRequest.reference_code}
            </p>
            <p className="mt-1 text-[13.5px] text-ink-3">
              The member must include this in the Zelle memo.
            </p>

            <Button
              variant="secondary"
              icon={MaximizeIcon}
              fullWidth
              className="mt-6"
              onClick={() => setFullscreen(true)}
            >
              Show fullscreen
            </Button>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader
                title="Once they have sent it"
                description="Check the bank before confirming. Confirming records the payment."
              />
              <div className="space-y-2.5">
                <Button icon={CheckIcon} fullWidth onClick={handleConfirm} loading={loading}>
                  Confirm payment received
                </Button>
                <Button variant="secondary" icon={XIcon} fullWidth onClick={handleCancel}>
                  Cancel this request
                </Button>
              </div>
            </Card>

            <Card tone="sunk">
              <p className="text-[14px] leading-relaxed text-ink-2">
                Status: <span className="font-semibold text-ink">{activeRequest.status}</span>
                <br />
                This request lapses on its own if it is not paid.
              </p>
            </Card>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreateRequest} className="max-w-xl">
          <Card>
            <CardHeader
              title="New payment request"
              description="Generates a reference code and a QR the member can scan."
            />
            <div className="space-y-5">
              <Field label="Amount" required>
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    step="0.01"
                    className="tnum"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                )}
              </Field>

              <Field label="What for" required>
                {({ id }) => (
                  <Select
                    id={id}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as PaymentPurpose)}
                  >
                    <option value="Donation">Donation</option>
                    <option value="Membership">Membership</option>
                    <option value="Event">Event</option>
                    <option value="Service">Service</option>
                  </Select>
                )}
              </Field>

              <Field label="Description" hint="Optional. Appears on the member's receipt.">
                {({ id }) => (
                  <Textarea
                    id={id}
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                )}
              </Field>

              <Button
                type="submit"
                size="lg"
                fullWidth
                icon={QrCodeIcon}
                loading={loading}
                disabled={!amount || Number(amount) <= 0}
              >
                Create request
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  )
}
