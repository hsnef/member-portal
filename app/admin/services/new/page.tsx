'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

export default function NewServicePage() {
  const router = useRouter()
  const supabase = createClient()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Service name is required')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.from('services').insert({
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

      if (error) throw error

      alert('Service added successfully!')
      router.push('/admin/services')
    } catch (error: any) {
      console.error('Error adding service:', error)
      alert(`Failed to add service: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Service</h1>
              <p className="mt-1 text-sm text-gray-600">
                Add a new service to the catalog
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/services')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Services
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name <span className="text-red-500">*</span>
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

              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name (for kiosk/short display)
                </label>
                <input
                  type="text"
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                  placeholder="Service details and what's included..."
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'Puja' | 'Other' })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                >
                  <option value="Puja">Puja</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
              <p className="text-sm text-gray-600">
                Set prices for different member types and locations. Leave blank if not applicable.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temple Pricing */}
                <div className="space-y-4 p-4 bg-blue-50 rounded-md">
                  <h4 className="font-medium text-blue-900">Inside Temple</h4>
                  <div>
                    <label htmlFor="price_member_temple" className="block text-sm font-medium text-gray-700 mb-1">
                      Member Price (Annual/Lifetime)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        id="price_member_temple"
                        step="0.01"
                        value={formData.price_member_temple}
                        onChange={(e) => setFormData({ ...formData, price_member_temple: e.target.value })}
                        className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="price_community_temple" className="block text-sm font-medium text-gray-700 mb-1">
                      Community Member Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        id="price_community_temple"
                        step="0.01"
                        value={formData.price_community_temple}
                        onChange={(e) => setFormData({ ...formData, price_community_temple: e.target.value })}
                        className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* External Pricing */}
                <div className="space-y-4 p-4 bg-green-50 rounded-md">
                  <h4 className="font-medium text-green-900">External Location</h4>
                  <div>
                    <label htmlFor="price_member_external" className="block text-sm font-medium text-gray-700 mb-1">
                      Member Price (Annual/Lifetime)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        id="price_member_external"
                        step="0.01"
                        value={formData.price_member_external}
                        onChange={(e) => setFormData({ ...formData, price_member_external: e.target.value })}
                        className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="price_community_external" className="block text-sm font-medium text-gray-700 mb-1">
                      Community Member Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        id="price_community_external"
                        step="0.01"
                        value={formData.price_community_external}
                        onChange={(e) => setFormData({ ...formData, price_community_external: e.target.value })}
                        className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900">Service Details</h3>

              <div>
                <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  id="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                  placeholder="e.g., 60"
                />
              </div>

              <div>
                <label htmlFor="preparation_notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Preparation Notes
                </label>
                <textarea
                  id="preparation_notes"
                  rows={3}
                  value={formData.preparation_notes}
                  onChange={(e) => setFormData({ ...formData, preparation_notes: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                  placeholder="What members need to prepare for this service..."
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900">Options</h3>

              <div className="space-y-3">
                <div className="flex items-center">
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_temple_only"
                    checked={formData.is_temple_only}
                    onChange={(e) => setFormData({ ...formData, is_temple_only: e.target.checked })}
                    className="h-4 w-4 text-saffron focus:ring-saffron-ring border-gray-300 rounded"
                  />
                  <label htmlFor="is_temple_only" className="ml-2 text-sm text-gray-700">
                    Temple only (cannot be performed at external locations)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requires_appointment"
                    checked={formData.requires_appointment}
                    onChange={(e) => setFormData({ ...formData, requires_appointment: e.target.checked })}
                    className="h-4 w-4 text-saffron focus:ring-saffron-ring border-gray-300 rounded"
                  />
                  <label htmlFor="requires_appointment" className="ml-2 text-sm text-gray-700">
                    Requires appointment/booking
                  </label>
                </div>
              </div>

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
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.push('/admin/services')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
              >
                {saving ? 'Saving...' : 'Add Service'}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
