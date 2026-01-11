'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/ImageUpload'

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-md animate-pulse" />,
})

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    event_time: '',
    location: '',
    short_description: '',
    description: '',
    category: 'Festival',
    max_capacity: '',
    member_price: '',
    non_member_price: '',
    registration_deadline: '',
    status: 'Draft' as 'Draft' | 'Published',
    image_url: '',
    contact_email: '',
    contact_phone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          event_name: formData.event_name,
          event_date: formData.event_date,
          event_time: formData.event_time,
          location: formData.location,
          short_description: formData.short_description || null,
          description: formData.description,
          category: formData.category,
          max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : 0,
          member_price: parseFloat(formData.member_price) || 0,
          non_member_price: parseFloat(formData.non_member_price) || 0,
          registration_deadline: formData.registration_deadline || null,
          status: formData.status,
          image_url: formData.image_url || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
        })
        .select()
        .single()

      if (error) throw error

      alert('Event created successfully!')
      router.push('/admin/events')
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
              <p className="mt-1 text-sm text-gray-600">
                Add a new event for members to register
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/events')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Events
            </button>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Image */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Image</h2>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  label="Event Banner / Poster"
                  aspectRatio="16/9"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Recommended size: 1200x675 pixels (16:9 ratio). This image will be displayed on the event listing and detail page.
                </p>
              </div>

              {/* Basic Information */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.event_name}
                      onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      placeholder="e.g., Diwali Festival 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.event_time}
                      onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      placeholder="e.g., HSNEF Temple Main Hall"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    >
                      <option value="Festival">Festival</option>
                      <option value="Puja">Puja</option>
                      <option value="Educational">Educational</option>
                      <option value="Social">Social</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Fundraiser">Fundraiser</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Event Summary (Short Description) */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Summary</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description (for event cards)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={200}
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    placeholder="Brief summary shown on event listing cards (max 200 characters)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.short_description.length}/200 characters. This appears on the event card in the events list.
                  </p>
                </div>
              </div>

              {/* Full Event Description (Rich Text) */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Full Event Description</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description (HTML supported) *
                  </label>
                  <RichTextEditor
                    content={formData.description}
                    onChange={(html) => setFormData({ ...formData, description: html })}
                    placeholder="Enter the full event description with formatting..."
                    minHeight="300px"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Use the toolbar to format text, add links, create lists, and more. This appears on the event detail page.
                  </p>
                </div>
              </div>

              {/* Registration Details */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Capacity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      placeholder="0 = unlimited"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave 0 for unlimited capacity</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.member_price}
                      onChange={(e) => setFormData({ ...formData, member_price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Non-Member Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.non_member_price}
                      onChange={(e) => setFormData({ ...formData, non_member_price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.registration_deadline}
                      onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Optional - defaults to event date</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      placeholder="events@hsnef.org"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      placeholder="(904) 555-1234"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Publication Status</h2>
                <div className="flex items-center gap-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Draft"
                      checked={formData.status === 'Draft'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Draft' })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Save as Draft (not visible to members)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Published"
                      checked={formData.status === 'Published'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Published' })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Publish Now (visible to members)
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.push('/admin/events')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
