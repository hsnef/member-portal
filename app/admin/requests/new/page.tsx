'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminFormView, FormSection } from '@/components/admin/AdminFormView'
import { MemberPicker } from '@/components/admin/MemberPicker'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { ScrollTextIcon } from 'lucide-react'

export default function NewRequestPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const [formData, setFormData] = useState({
    request_type: 'Puja',
    service_description: '',
    requested_date: '',
    amount: '',
    status: 'Draft' as 'Draft' | 'Sent',
    notes: '',
    send_invoice: false,
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
      const { data: request, error } = await supabase
        .from('requests')
        .insert({
          member_id: selectedMember.id,
          membership_id: selectedMember.membership_id,
          request_type: formData.request_type,
          service_description: formData.service_description,
          requested_date: formData.requested_date,
          amount: parseFloat(formData.amount),
          status: formData.status,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      // Send invoice email if send_invoice is true
      if (formData.send_invoice && formData.status === 'Sent' && request) {
        try {
          const emailResponse = await fetch('/api/requests/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId: request.id,
              status: 'Sent',
            }),
          })

          if (emailResponse.ok) {
            alert('Request created and invoice email sent successfully!')
          } else {
            alert('Request created but failed to send email notification.')
          }
        } catch (emailError) {
          console.error('Error sending invoice email:', emailError)
          alert('Request created but failed to send email notification.')
        }
      } else {
        alert('Request created successfully!')
      }

      router.push('/admin/requests')
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request')
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
      eyebrow="Requests"
      title="Raise a request"
      description="Invoice a member for a service. Save as a draft, or send it straight away."
      backHref="/admin/requests"
      onSubmit={handleSubmit}
      saving={loading}
      saveLabel="Create request"
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

      <FormSection icon={ScrollTextIcon} tone="lotus" title="Request">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Type" required>
              {({ id }) => (
                <Select
                  id={id}
                  value={formData.request_type}
                  onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                >
                  <option value="Puja">Puja</option>
                  <option value="Sponsorship">Sponsorship</option>
                  <option value="Donation Request">Donation request</option>
                  <option value="Service">Service</option>
                  <option value="Facility Rental">Facility rental</option>
                </Select>
              )}
            </Field>
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
          </div>

          <Field label="Description" required hint="What the member is being invoiced for.">
            {({ id }) => (
              <Textarea
                id={id}
                rows={3}
                value={formData.service_description}
                onChange={(e) =>
                  setFormData({ ...formData, service_description: e.target.value })
                }
              />
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Requested for">
              {({ id }) => (
                <Input
                  id={id}
                  type="date"
                  className="tnum"
                  value={formData.requested_date}
                  onChange={(e) => setFormData({ ...formData, requested_date: e.target.value })}
                />
              )}
            </Field>
            <Field
              label="Status"
              hint="Draft stays with the office. Sent makes it visible to the member."
            >
              {({ id }) => (
                <Select
                  id={id}
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'Draft' | 'Sent' })
                  }
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                </Select>
              )}
            </Field>
          </div>

          <Field label="Office notes" hint="Not shown to the member.">
            {({ id }) => (
              <Textarea
                id={id}
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            )}
          </Field>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={formData.send_invoice}
              disabled={formData.status !== 'Sent'}
              onChange={(e) => setFormData({ ...formData, send_invoice: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
            />
            <span>
              <span className="block text-[15px] text-ink">Email the invoice now</span>
              <span className="block text-[13.5px] text-ink-3">
                {formData.status === 'Sent'
                  ? 'The member gets the invoice as soon as you save.'
                  : 'Set the status to Sent first - a draft is not sent to anyone.'}
              </span>
            </span>
          </label>
        </div>
      </FormSection>
    </AdminFormView>
  )
}
