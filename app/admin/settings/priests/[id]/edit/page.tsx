'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPhoneNumber } from '@/lib/utils/formatters'
import { AdminFormView, FormSection } from '@/components/admin/AdminFormView'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { UserCogIcon, MailIcon, SettingsIcon } from 'lucide-react'

export default function EditPriestPage() {
  const router = useRouter()
  const params = useParams()
  const priestId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    email: '',
    specialties: '',
    picture_url: '',
    profile_url: '',
    display_order: 0,
    is_active: true,
  })

  useEffect(() => {
    if (priestId) {
      fetchPriest()
    }
  }, [priestId])

  const fetchPriest = async () => {
    try {
      const { data, error } = await supabase
        .from('purohits')
        .select('*')
        .eq('id', priestId)
        .single()

      if (error) throw error

      setFormData({
        name: data.name || '',
        bio: data.bio || '',
        phone: data.phone || '',
        email: data.email || '',
        specialties: data.specialties || '',
        picture_url: data.picture_url || '',
        profile_url: data.profile_url || '',
        display_order: data.display_order || 0,
        is_active: data.is_active ?? true,
      })
    } catch (error) {
      console.error('Error fetching priest:', error)
      alert('Failed to load priest')
      router.push('/admin/settings/priests')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('purohits')
        .update({
          name: formData.name.trim(),
          bio: formData.bio.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          specialties: formData.specialties.trim() || null,
          picture_url: formData.picture_url.trim() || null,
          profile_url: formData.profile_url.trim() || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        })
        .eq('id', priestId)

      if (error) throw error

      alert('Priest updated successfully!')
      router.push('/admin/settings/priests')
    } catch (error: any) {
      console.error('Error updating priest:', error)
      alert(`Failed to update priest: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminFormView
      eyebrow="Settings"
      title="Edit priest"
      description="Changes apply to future bookings; existing assignments are unaffected."
      backHref="/admin/settings/priests"
      onSubmit={handleSubmit}
      saving={saving}
      saveLabel="Save changes"
      loading={loading}
    >
      <FormSection icon={UserCogIcon} tone="kumkum" title="Priest details">
        <div className="space-y-5">
          <Field label="Name" required>
            {({ id }) => (
              <Input
                id={id}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}
          </Field>

          <Field label="Specialities" hint="Shown to members when choosing a purohit.">
            {({ id }) => (
              <Input
                id={id}
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
              />
            )}
          </Field>

          <Field label="Bio">
            {({ id }) => (
              <Textarea
                id={id}
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection icon={MailIcon} tone="tulsi" title="Contact">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone">
            {({ id }) => (
              <Input
                id={id}
                type="tel"
                className="tnum"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })
                }
              />
            )}
          </Field>
          <Field label="Email">
            {({ id }) => (
              <Input
                id={id}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection icon={SettingsIcon} tone="sandal" title="Listing">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Picture URL">
            {({ id }) => (
              <Input
                id={id}
                value={formData.picture_url}
                onChange={(e) => setFormData({ ...formData, picture_url: e.target.value })}
              />
            )}
          </Field>
          <Field label="Profile URL">
            {({ id }) => (
              <Input
                id={id}
                value={formData.profile_url}
                onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              />
            )}
          </Field>
          <Field label="Display order" hint="Lower numbers appear first.">
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
          <label className="flex items-center gap-3 self-end pb-3">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
            />
            <span className="text-[15px] text-ink">
              Active - available to assign to bookings
            </span>
          </label>
        </div>
      </FormSection>
    </AdminFormView>
  )
}
