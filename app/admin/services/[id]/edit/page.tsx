'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminFormView, FormSection } from '@/components/admin/AdminFormView'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { ClipboardListIcon, CreditCardIcon, SettingsIcon } from 'lucide-react'

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    category: 'Puja' as 'Puja' | 'Other',
    price_member_temple: '',
    price_community_temple: '',
    price_member_external: '',
    price_community_external: '',
    duration_minutes: '',
    preparation_notes: '',
    is_active: true,
    is_temple_only: false,
    requires_appointment: true,
    display_order: 0,
  })

  useEffect(() => {
    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  const fetchService = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single()

      if (error) throw error

      setFormData({
        name: data.name || '',
        display_name: data.display_name || '',
        description: data.description || '',
        category: data.category || 'Puja',
        price_member_temple: data.price_member_temple?.toString() || '',
        price_community_temple: data.price_community_temple?.toString() || '',
        price_member_external: data.price_member_external?.toString() || '',
        price_community_external: data.price_community_external?.toString() || '',
        duration_minutes: data.duration_minutes?.toString() || '',
        preparation_notes: data.preparation_notes || '',
        is_active: data.is_active ?? true,
        is_temple_only: data.is_temple_only ?? false,
        requires_appointment: data.requires_appointment ?? true,
        display_order: data.display_order || 0,
      })
    } catch (error) {
      console.error('Error fetching service:', error)
      alert('Failed to load service')
      router.push('/admin/services')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Service name is required')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('services')
        .update({
          name: formData.name.trim(),
          display_name: formData.display_name.trim() || null,
          description: formData.description.trim() || null,
          category: formData.category,
          price_member_temple: formData.price_member_temple ? parseFloat(formData.price_member_temple) : null,
          price_community_temple: formData.price_community_temple ? parseFloat(formData.price_community_temple) : null,
          price_member_external: formData.price_member_external ? parseFloat(formData.price_member_external) : null,
          price_community_external: formData.price_community_external ? parseFloat(formData.price_community_external) : null,
          duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
          preparation_notes: formData.preparation_notes.trim() || null,
          is_active: formData.is_active,
          is_temple_only: formData.is_temple_only,
          requires_appointment: formData.requires_appointment,
          display_order: formData.display_order,
        })
        .eq('id', serviceId)

      if (error) throw error

      alert('Service updated successfully!')
      router.push('/admin/services')
    } catch (error: any) {
      console.error('Error updating service:', error)
      alert(`Failed to update service: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminFormView
      eyebrow="Service catalog"
      title="Edit service"
      description="Price changes apply to new bookings; existing ones keep the price they were quoted."
      backHref="/admin/services"
      onSubmit={handleSubmit}
      saving={saving}
      saveLabel="Save changes"
      loading={loading}
    >
      <FormSection icon={ClipboardListIcon} tone="copper" title="Service">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Internal name" required hint="Used in the office and on invoices.">
              {({ id }) => (
                <Input
                  id={id}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              )}
            </Field>
            <Field label="Display name" hint="What members see. Defaults to the internal name.">
              {({ id }) => (
                <Input
                  id={id}
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              )}
            </Field>
          </div>

          <Field label="Description">
            {({ id }) => (
              <Textarea
                id={id}
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" required>
              {({ id }) => (
                <Select
                  id={id}
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as 'Puja' | 'Other' })
                  }
                >
                  <option value="Puja">Puja</option>
                  <option value="Other">Other</option>
                </Select>
              )}
            </Field>
            <Field label="Duration (minutes)">
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  className="tnum"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_minutes: e.target.value })
                  }
                />
              )}
            </Field>
          </div>

          <Field
            label="Preparation notes"
            hint="Shown to the member when they book, e.g. what to bring."
          >
            {({ id }) => (
              <Textarea
                id={id}
                rows={3}
                value={formData.preparation_notes}
                onChange={(e) =>
                  setFormData({ ...formData, preparation_notes: e.target.value })
                }
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection
        icon={CreditCardIcon}
        tone="tulsi"
        title="Pricing"
        description="Members pay less, and a service performed away from the temple may cost more."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Member, at the temple">
            {({ id }) => (
              <Input
                id={id}
                type="number"
                step="0.01"
                className="tnum"
                value={formData.price_member_temple}
                onChange={(e) =>
                  setFormData({ ...formData, price_member_temple: e.target.value })
                }
              />
            )}
          </Field>
          <Field label="Non-member, at the temple">
            {({ id }) => (
              <Input
                id={id}
                type="number"
                step="0.01"
                className="tnum"
                value={formData.price_community_temple}
                onChange={(e) =>
                  setFormData({ ...formData, price_community_temple: e.target.value })
                }
              />
            )}
          </Field>
          <Field label="Member, elsewhere">
            {({ id }) => (
              <Input
                id={id}
                type="number"
                step="0.01"
                className="tnum"
                disabled={formData.is_temple_only}
                value={formData.price_member_external}
                onChange={(e) =>
                  setFormData({ ...formData, price_member_external: e.target.value })
                }
              />
            )}
          </Field>
          <Field label="Non-member, elsewhere">
            {({ id }) => (
              <Input
                id={id}
                type="number"
                step="0.01"
                className="tnum"
                disabled={formData.is_temple_only}
                value={formData.price_community_external}
                onChange={(e) =>
                  setFormData({ ...formData, price_community_external: e.target.value })
                }
              />
            )}
          </Field>
        </div>
        {formData.is_temple_only && (
          <p className="mt-3 text-[13.5px] text-ink-3">
            The two away-from-temple prices are disabled because this service is marked temple
            only.
          </p>
        )}
      </FormSection>

      <FormSection icon={SettingsIcon} tone="sandal" title="Availability">
        <div className="space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
            />
            <span>
              <span className="block text-[15px] text-ink">Active</span>
              <span className="block text-[13.5px] text-ink-3">
                Members can see and book this service.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={formData.is_temple_only}
              onChange={(e) => setFormData({ ...formData, is_temple_only: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
            />
            <span>
              <span className="block text-[15px] text-ink">Temple only</span>
              <span className="block text-[13.5px] text-ink-3">
                Cannot be performed at a member's home or another venue.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={formData.requires_appointment}
              onChange={(e) =>
                setFormData({ ...formData, requires_appointment: e.target.checked })
              }
              className="mt-1 h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
            />
            <span>
              <span className="block text-[15px] text-ink">Requires an appointment</span>
              <span className="block text-[13.5px] text-ink-3">
                The office confirms a date and time before it goes ahead.
              </span>
            </span>
          </label>

          <Field label="Display order" hint="Lower numbers appear first in the catalog.">
            {({ id }) => (
              <Input
                id={id}
                type="number"
                className="tnum"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: Number(e.target.value) })
                }
              />
            )}
          </Field>
        </div>
      </FormSection>
    </AdminFormView>
  )
}
