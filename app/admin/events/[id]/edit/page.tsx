'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/ImageUpload'
import { formatPhoneNumber } from '@/lib/utils/formatters'
import { AdminFormView, FormSection } from '@/components/admin/AdminFormView'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { CalendarDaysIcon, ImageIcon, TicketIcon, MailIcon } from 'lucide-react'

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-md animate-pulse" />,
})

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    event_time: '',
    location: '',
    short_description: '',
    description: '',
    category: 'Festival',
    rsvp_enabled: true,
    is_payable: false,
    max_capacity: '',
    member_price: '',
    non_member_price: '',
    registration_deadline: '',
    status: 'Draft' as 'Draft' | 'Published' | 'Cancelled' | 'Completed',
    image_url: '',
    contact_email: '',
    contact_phone: '',
  })

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          event_name: data.event_name || '',
          event_date: data.event_date || '',
          event_time: data.event_time || '',
          location: data.location || '',
          short_description: data.short_description || '',
          description: data.description || '',
          category: data.category || 'Festival',
          rsvp_enabled: data.rsvp_enabled ?? true,
          is_payable: data.is_payable ?? false,
          max_capacity: data.max_capacity?.toString() || '',
          member_price: data.member_price?.toString() || '',
          non_member_price: data.non_member_price?.toString() || '',
          registration_deadline: data.registration_deadline || '',
          status: data.status || 'Draft',
          image_url: data.image_url || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
        })
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      alert('Failed to load event')
      router.push('/admin/events')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('events')
        .update({
          event_name: formData.event_name,
          event_date: formData.event_date,
          event_time: formData.event_time,
          location: formData.location,
          short_description: formData.short_description || null,
          description: formData.description,
          category: formData.category,
          rsvp_enabled: formData.rsvp_enabled,
          is_payable: formData.is_payable,
          max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : 0,
          member_price: formData.is_payable ? (parseFloat(formData.member_price) || 0) : 0,
          non_member_price: formData.is_payable ? (parseFloat(formData.non_member_price) || 0) : 0,
          registration_deadline: formData.registration_deadline || null,
          status: formData.status,
          image_url: formData.image_url || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
        })
        .eq('id', eventId)

      if (error) throw error

      alert('Event updated successfully!')
      router.push('/admin/events')
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminFormView
      eyebrow="Events"
      title="Edit event"
      description="Changes are live to members as soon as you save a published event."
      backHref="/admin/events"
      onSubmit={handleSubmit}
      saving={saving}
      saveLabel="Save changes"
      loading={loading}
    >
      <FormSection icon={ImageIcon} tone="marigold" title="Event image">
        <ImageUpload
          value={formData.image_url}
          onChange={(url) => setFormData({ ...formData, image_url: url })}
          label="Banner or poster"
          aspectRatio="16/9"
        />
        <p className="mt-2 text-[13px] text-ink-3">
          1200x675 works best. Shown on the event list and its detail page.
        </p>
      </FormSection>

      <FormSection icon={CalendarDaysIcon} tone="marigold" title="The event">
        <div className="space-y-5">
          <Field label="Name" required>
            {({ id }) => (
              <Input
                id={id}
                value={formData.event_name}
                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              />
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date" required>
              {({ id }) => (
                <Input
                  id={id}
                  type="date"
                  className="tnum"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              )}
            </Field>
            <Field label="Time" required>
              {({ id }) => (
                <Input
                  id={id}
                  type="time"
                  className="tnum"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                />
              )}
            </Field>
            <Field label="Location" required>
              {({ id }) => (
                <Input
                  id={id}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              )}
            </Field>
            <Field label="Category" required>
              {({ id }) => (
                <Select
                  id={id}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Festival">Festival</option>
                  <option value="Puja">Puja</option>
                  <option value="Educational">Educational</option>
                  <option value="Social">Social</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Fundraiser">Fundraiser</option>
                  <option value="Other">Other</option>
                </Select>
              )}
            </Field>
          </div>

          <Field
            label="Short description"
            hint="One or two lines. Shown on the event card in the list."
          >
            {({ id }) => (
              <Textarea
                id={id}
                rows={2}
                value={formData.short_description}
                onChange={(e) =>
                  setFormData({ ...formData, short_description: e.target.value })
                }
              />
            )}
          </Field>

          <div>
            <p className="mb-2 block text-[13px] font-bold uppercase tracking-[0.09em] text-ink-2">
              Full description
            </p>
            <RichTextEditor
              content={formData.description}
              onChange={(html) => setFormData({ ...formData, description: html })}
              placeholder="The full description members will read..."
              minHeight="300px"
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        icon={TicketIcon}
        tone="tulsi"
        title="Registration"
        description="Turn RSVP off for an open event nobody needs to book."
      >
        <div className="space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={formData.rsvp_enabled}
              onChange={(e) => setFormData({ ...formData, rsvp_enabled: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
            />
            <span>
              <span className="block text-[15px] text-ink">Members can register</span>
              <span className="block text-[13.5px] text-ink-3">
                Adds a Register button and tracks who is coming.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={formData.is_payable}
              disabled={!formData.rsvp_enabled}
              onChange={(e) => setFormData({ ...formData, is_payable: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
            />
            <span>
              <span className="block text-[15px] text-ink">Charge for a place</span>
              <span className="block text-[13.5px] text-ink-3">
                {formData.rsvp_enabled
                  ? 'Members pay when they register.'
                  : 'Turn registration on first - there is nothing to charge for otherwise.'}
              </span>
            </span>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Member price" >
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  step="0.01"
                  className="tnum"
                  disabled={!formData.is_payable}
                  value={formData.member_price}
                  onChange={(e) => setFormData({ ...formData, member_price: e.target.value })}
                />
              )}
            </Field>
            <Field label="Non-member price">
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  step="0.01"
                  className="tnum"
                  disabled={!formData.is_payable}
                  value={formData.non_member_price}
                  onChange={(e) =>
                    setFormData({ ...formData, non_member_price: e.target.value })
                  }
                />
              )}
            </Field>
            <Field label="Capacity" hint="Leave blank for unlimited.">
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  className="tnum"
                  disabled={!formData.rsvp_enabled}
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                />
              )}
            </Field>
            <Field label="Registration closes">
              {({ id }) => (
                <Input
                  id={id}
                  type="date"
                  className="tnum"
                  disabled={!formData.rsvp_enabled}
                  value={formData.registration_deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, registration_deadline: e.target.value })
                  }
                />
              )}
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection icon={MailIcon} tone="sandal" title="Contact and publishing">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Contact email" hint="Shown on the event page for questions.">
            {({ id }) => (
              <Input
                id={id}
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            )}
          </Field>
          <Field label="Contact phone">
            {({ id }) => (
              <Input
                id={id}
                type="tel"
                className="tnum"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            )}
          </Field>
          <Field
            label="Status"
            className="sm:col-span-2"
            hint="Draft is only visible to the office. Published is live to members."
          >
            {({ id }) => (
              <Select
                id={id}
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'Draft' | 'Published' })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </Select>
            )}
          </Field>
        </div>
      </FormSection>
    </AdminFormView>
  )
}
