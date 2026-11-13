'use client'

/**
 * Record a payment taken at the office: cash, cheque, Zelle, or the temple's
 * card machine. The office picks who paid, then WHAT for (one of the member's
 * open items, a membership, or a donation) and how. The server prices it and
 * records it through the one settlement step (/api/admin/payments), so the
 * booking or membership is marked paid and the receipt is emailed, exactly as
 * for an online payment. Spec: docs/architecture/payments.md.
 */

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminFormView, FormSection } from '@/components/admin/AdminFormView'
import { MemberPicker, type PickableMember } from '@/components/admin/MemberPicker'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { CreditCardIcon, ReceiptIcon } from 'lucide-react'
import { DONATION_PURPOSES } from '@/lib/payments/donations'
import { paymentMethodLabel } from '@/lib/payments/labels'
import { formatCurrency } from '@/utils/format'
import type { CheckoutItem } from '@/lib/payments/checkout'
import type { OpenItems, OfficeMethod } from '@/lib/payments/office'

const METHODS: OfficeMethod[] = ['Cash', 'Check', 'Zelle', 'Card']

/** One choice in "What for", keyed so it fits a <select>. */
interface Choice {
  key: string
  group: string
  label: string
  amount: number | null
  item: CheckoutItem | null
}

function choicesFor(open: OpenItems | null): Choice[] {
  if (!open) return []
  const out: Choice[] = []
  if (open.membership.canBuy) {
    for (const level of ['Annual', 'Lifetime'] as const) {
      const asked = open.member.requestedLevel === level ? ' (asked for)' : ''
      out.push({
        key: `membership:${level}`,
        group: 'Membership',
        label: `${level} membership${asked}`,
        amount: level === 'Annual' ? open.membership.annual : open.membership.lifetime,
        item: { kind: 'membership', level },
      })
    }
  }
  for (const b of open.bookings) out.push({ key: `booking:${b.id}`, group: 'Bookings', label: b.label, amount: b.amount, item: { kind: 'booking', bookingId: b.id } })
  for (const r of open.requests) out.push({ key: `request:${r.id}`, group: 'Requests', label: r.label, amount: r.amount, item: { kind: 'request', requestId: r.id } })
  for (const e of open.events) out.push({ key: `event:${e.id}`, group: 'Events', label: e.label, amount: e.amount, item: { kind: 'event', eventId: e.id } })
  out.push({ key: 'donation', group: 'Donation', label: 'Donation', amount: null, item: null })
  return out
}

const newSubmissionId = () => crypto.randomUUID()

export default function RecordPaymentPage() {
  // useSearchParams needs a Suspense boundary for the static build.
  return (
    <Suspense>
      <RecordPayment />
    </Suspense>
  )
}

function RecordPayment() {
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PickableMember[]>([])
  const [member, setMember] = useState<PickableMember | null>(null)
  const [open, setOpen] = useState<OpenItems | null>(null)
  const [loadingOpen, setLoadingOpen] = useState(false)

  const [choiceKey, setChoiceKey] = useState('')
  const [fund, setFund] = useState('General')
  const [donationAmount, setDonationAmount] = useState('')
  const [method, setMethod] = useState<OfficeMethod>('Cash')
  const [checkNumber, setCheckNumber] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const [submissionId, setSubmissionId] = useState(newSubmissionId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Opened from a member's page (?memberId=): start with that member.
  const params = useSearchParams()
  const linkedMemberId = params.get('memberId')
  useEffect(() => {
    if (!linkedMemberId) return
    supabase
      .from('members')
      .select('id, membership_id, first_name, last_name, business_name, member_class, primary_email, current_level')
      .eq('id', linkedMemberId)
      .maybeSingle()
      .then(({ data }) => data && setMember(data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedMemberId])

  const choices = useMemo(() => choicesFor(open), [open])
  const choice = choices.find((c) => c.key === choiceKey) ?? null
  const amount = choice?.key === 'donation' ? Number(donationAmount) || 0 : choice?.amount ?? 0

  // A member's open items, priced by the server.
  useEffect(() => {
    setOpen(null)
    setChoiceKey('')
    if (!member) return
    setLoadingOpen(true)
    fetch(`/api/admin/payments/open-items?memberId=${encodeURIComponent(member.id)}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load this member')
        setOpen(data)
        // Pre-select what they most likely came to pay for.
        if (data.member.requestedLevel) setChoiceKey(`membership:${data.member.requestedLevel}`)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingOpen(false))
  }, [member])

  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) return
    const { data, error } = await supabase
      .from('members')
      .select('id, membership_id, first_name, last_name, business_name, member_class, primary_email, current_level')
      .or(`membership_id.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,business_name.ilike.%${q}%,primary_email.ilike.%${q}%`)
      .limit(10)
    if (error) setError('Could not search members')
    else setSearchResults(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!member || !choice) return

    const item: CheckoutItem | null =
      choice.key === 'donation' ? { kind: 'donation', amount: Number(donationAmount), fund } : choice.item
    if (!item || !(amount > 0)) {
      setError('Enter the amount')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, memberId: member.id, method, item, checkNumber, reference, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not record the payment')
      setSuccess(
        `Recorded ${formatCurrency(data.amount, true)} (${paymentMethodLabel(method)}) as receipt ${data.receiptNumber}.` +
          (data.receiptEmailed ? ' The receipt was emailed to the member.' : ''),
      )
      // Ready for the next payment; the same form can't be recorded twice.
      setSubmissionId(newSubmissionId())
      setChoiceKey('')
      setDonationAmount('')
      setCheckNumber('')
      setReference('')
      setNotes('')
      // Reload the member (a membership payment changes their level and
      // number) and, with it, their open items.
      const { data: fresh } = await supabase
        .from('members')
        .select('id, membership_id, first_name, last_name, business_name, member_class, primary_email, current_level')
        .eq('id', member.id)
        .maybeSingle()
      setMember(fresh ?? { ...member })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the payment')
    } finally {
      setSaving(false)
    }
  }

  const groups = Array.from(new Set(choices.map((c) => c.group)))

  return (
    <AdminFormView
      eyebrow="Payments"
      title="Record a payment"
      description="For cash, cheque, Zelle or the temple's card machine. Online card payments record themselves."
      backHref="/admin/payments"
      onSubmit={handleSubmit}
      saving={saving}
      saveLabel={amount > 0 ? `Record ${formatCurrency(amount, true)}` : 'Record payment'}
      disabled={!member || !choice || !(amount > 0)}
      disabledReason={!member ? 'Choose a member first.' : 'Choose what the payment is for.'}
      error={error}
      success={success}
    >
      <MemberPicker
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        results={searchResults}
        selected={member}
        onSelect={(m) => {
          setSuccess(null)
          setError(null)
          setMember(m)
          setSearchResults([])
        }}
        onClear={() => setMember(null)}
      />

      {member && (
        <FormSection icon={ReceiptIcon} tone="saffron" title="What for">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Payment for"
              required
              className="sm:col-span-2"
              hint={loadingOpen ? 'Loading what this member can pay for…' : 'Their open bookings, requests and events, membership, or a donation.'}
            >
              {({ id }) => (
                <Select id={id} value={choiceKey} onChange={(e) => setChoiceKey(e.target.value)} disabled={loadingOpen}>
                  <option value="">Choose…</option>
                  {groups.map((g) => (
                    <optgroup key={g} label={g}>
                      {choices
                        .filter((c) => c.group === g)
                        .map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                            {c.amount != null ? ` — ${formatCurrency(c.amount, true)}` : ''}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </Select>
              )}
            </Field>
            {choice?.key === 'donation' && (
              <>
                <Field label="Fund" required>
                  {({ id }) => (
                    <Select id={id} value={fund} onChange={(e) => setFund(e.target.value)}>
                      {DONATION_PURPOSES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Amount" required>
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      min="1"
                      step="0.01"
                      className="tnum"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                    />
                  )}
                </Field>
              </>
            )}
          </div>
        </FormSection>
      )}

      {member && (
        <FormSection icon={CreditCardIcon} tone="tulsi" title="How they paid">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Method" required>
              {({ id }) => (
                <Select id={id} value={method} onChange={(e) => setMethod(e.target.value as OfficeMethod)}>
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {paymentMethodLabel(m)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {method === 'Check' && (
              <Field label="Cheque number" required>
                {({ id }) => <Input id={id} className="tnum" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />}
              </Field>
            )}
            {(method === 'Zelle' || method === 'Card') && (
              <Field
                label={method === 'Zelle' ? 'Zelle confirmation number' : 'Card machine receipt number'}
                hint="Optional, but it helps match the bank statement."
              >
                {({ id }) => <Input id={id} className="tnum" value={reference} onChange={(e) => setReference(e.target.value)} />}
              </Field>
            )}
            <Field label="Notes" className="sm:col-span-2">
              {({ id }) => <Textarea id={id} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />}
            </Field>
          </div>
        </FormSection>
      )}
    </AdminFormView>
  )
}
