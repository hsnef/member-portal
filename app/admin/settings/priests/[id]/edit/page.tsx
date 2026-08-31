'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { formatPhoneNumber } from '@/lib/utils/formatters'

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

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
        <AdminLayout>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading priest...</p>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Priest</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update priest information
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/settings/priests')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              &larr; Back to Priests
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Biography
              </label>
              <textarea
                id="bio"
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                placeholder="Brief introduction and qualifications..."
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="(555) 123-4567"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                />
              </div>
            </div>

            {/* Specialties */}
            <div>
              <label htmlFor="specialties" className="block text-sm font-medium text-gray-700 mb-1">
                Specialties
              </label>
              <input
                type="text"
                id="specialties"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                placeholder="e.g., Vedic rituals, Havans, Weddings"
              />
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="picture_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Picture URL
                </label>
                <input
                  type="url"
                  id="picture_url"
                  value={formData.picture_url}
                  onChange={(e) => setFormData({ ...formData, picture_url: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label htmlFor="profile_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile URL
                </label>
                <input
                  type="url"
                  id="profile_url"
                  value={formData.profile_url}
                  onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Display Order & Active */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  id="display_order"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center mt-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-saffron focus:ring-saffron-ring border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active (available for booking)
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.push('/admin/settings/priests')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
