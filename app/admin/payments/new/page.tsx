'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PaymentCategory, PaymentMethod } from '@/types/database'
import { AdminFormView, FormSection } from '@/components/admin/AdminFormView'
import { MemberPicker } from '@/components/admin/MemberPicker'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { CreditCardIcon } from 'lucide-react'

export default function RecordPaymentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'Cash' as PaymentMethod,
    category: 'Donation' as PaymentCategory,
    check_number: '',
    transaction_id: '',
    notes: '',
  })

  // Search for member
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, membership_id, first_name, last_name, business_name, member_class, primary_email')
        .or(`membership_id.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,business_name.ilike.%${searchQuery}%,primary_email.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching members:', error)
      alert('Failed to search members')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMember) {
      alert('Please select a member')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          member_id: selectedMember.id,
          amount: parseFloat(formData.amount),
          payment_date: new Date().toISOString(),
          method: formData.payment_method,
          purpose: formData.category,
          check_number: formData.check_number || null,
          zelle_reference: formData.payment_method === 'Zelle' ? formData.transaction_id || null : null,
          stripe_payment_intent_id: formData.payment_method === 'Stripe' ? formData.transaction_id || null : null,
          notes: formData.notes || null,
        })

      if (error) throw error

      alert('Payment recorded successfully!')
      router.push('/admin/payments')
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  const getMemberDisplayName = (member: any) => {
    return member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name
  }

  return (
    <AdminFormView
      eyebrow="Payments"
      title="Record a payment"
      description="For cash, check or Zelle taken at the office. Card payments record themselves."
      backHref="/admin/payments"
      onSubmit={handleSubmit}
      saving={loading}
      saveLabel="Record payment"
      disabled={!selectedMember}
      disabledReason="Choose a member first."
    >
      <MemberPicker
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        results={searchResults}
        selected={selectedMember}
        onSelect={(m) => {
          setSelectedMember(m)
          setSearchResults([])
        }}
        onClear={() => setSelectedMember(null)}
      />

      <FormSection icon={CreditCardIcon} tone="tulsi" title="Payment">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Amount" required>
            {({ id }) => (
              <Input
                id={id}
                type="number"
                step="0.01"
                className="tnum"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            )}
          </Field>
          <Field label="What for" required>
            {({ id }) => (
              <Select
                id={id}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as PaymentCategory })
                }
              >
                <option value="Donation">Donation</option>
                <option value="Membership">Membership</option>
                <option value="Event">Event</option>
                <option value="Service">Service</option>
              </Select>
            )}
          </Field>
          <Field label="How they paid" required>
            {({ id }) => (
              <Select
                id={id}
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })
                }
              >
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Zelle">Zelle</option>
                <option value="Card">Card</option>
              </Select>
            )}
          </Field>
          <Field
            label={formData.payment_method === 'Check' ? 'Check number' : 'Reference'}
            hint={
              formData.payment_method === 'Check'
                ? 'From the check itself.'
                : 'Zelle reference or transaction id, if there is one.'
            }
          >
            {({ id }) =>
              formData.payment_method === 'Check' ? (
                <Input
                  id={id}
                  className="tnum"
                  value={formData.check_number}
                  onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                />
              ) : (
                <Input
                  id={id}
                  className="tnum"
                  value={formData.transaction_id}
                  onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                />
              )
            }
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            {({ id }) => (
              <Textarea
                id={id}
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            )}
          </Field>
        </div>
      </FormSection>
    </AdminFormView>
  )
}
