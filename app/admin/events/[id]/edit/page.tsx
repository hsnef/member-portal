'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/ImageUpload'
import { formatPhoneNumber } from '@/lib/utils/formatters'

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

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading event...</p>
            </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update event details
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
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

              {/* Registration & Payment Settings */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration & Payment</h2>

                {/* RSVP and Payment Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Enable RSVP Toggle */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Enable RSVP</label>
                        <p className="text-xs text-gray-500 mt-1">
                          Allow members to register for this event
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, rsvp_enabled: !formData.rsvp_enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.rsvp_enabled ? 'bg-saffron' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.rsvp_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {formData.rsvp_enabled && (
                      <div className="mt-3 text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Members can RSVP for this event
                      </div>
                    )}
                    {!formData.rsvp_enabled && (
                      <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Event is informational only (no registration)
                      </div>
                    )}
                  </div>

                  {/* Make Payable Toggle */}
                  <div className={`bg-gray-50 rounded-lg p-4 ${!formData.rsvp_enabled ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Require Payment</label>
                        <p className="text-xs text-gray-500 mt-1">
                          Charge a fee for registration
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!formData.rsvp_enabled}
                        onClick={() => setFormData({ ...formData, is_payable: !formData.is_payable })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.is_payable ? 'bg-saffron' : 'bg-gray-300'
                        } ${!formData.rsvp_enabled ? 'cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.is_payable ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {formData.rsvp_enabled && formData.is_payable && (
                      <div className="mt-3 text-xs text-saffron flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Payment required to complete registration
                      </div>
                    )}
                    {formData.rsvp_enabled && !formData.is_payable && (
                      <div className="mt-3 text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Free registration (no payment needed)
                      </div>
                    )}
                  </div>
                </div>

                {/* Capacity and Deadline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Capacity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                      placeholder="0 = unlimited"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave 0 or empty for unlimited capacity</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.registration_deadline}
                      onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Optional - defaults to event date</p>
                  </div>
                </div>

                {/* Price Fields - Only shown when payable is enabled */}
                {formData.is_payable && formData.rsvp_enabled && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-saffron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Member Price ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required={formData.is_payable}
                          value={formData.member_price}
                          onChange={(e) => setFormData({ ...formData, member_price: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                          placeholder="25.00"
                        />
                        <p className="mt-1 text-xs text-gray-500">Price for Annual/Lifetime members</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Non-Member Price ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required={formData.is_payable}
                          value={formData.non_member_price}
                          onChange={(e) => setFormData({ ...formData, non_member_price: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                          placeholder="35.00"
                        />
                        <p className="mt-1 text-xs text-gray-500">Price for non-members / guests</p>
                      </div>
                    </div>
                  </div>
                )}
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
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
                      onChange={(e) => setFormData({ ...formData, contact_phone: formatPhoneNumber(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                      placeholder="(904) 555-1234"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Publication Status</h2>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Draft"
                      checked={formData.status === 'Draft'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Draft' })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Draft (not visible to members)
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
                      Published (visible to members)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Cancelled"
                      checked={formData.status === 'Cancelled'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Cancelled' })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-red-600">
                      Cancelled
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Completed"
                      checked={formData.status === 'Completed'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Completed' })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-blue-600">
                      Completed
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
                  disabled={saving}
                  className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
