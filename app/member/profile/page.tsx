'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Member, Nakshatra } from '@/types/database'

const NAKSHATRAS: Nakshatra[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshta',
  'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
]

export default function MemberProfilePage() {
  const router = useRouter()
  const { member: authMember } = useAuth()
  const supabase = createClient()

  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    // Primary contact
    first_name: '',
    last_name: '',
    primary_email: '',
    primary_phone: '',
    primary_phone_2: '',
    nakshatra: '' as Nakshatra | '',
    family_gotra: '',
    // Secondary contact (spouse)
    secondary_first_name: '',
    secondary_last_name: '',
    secondary_email: '',
    secondary_phone: '',
    secondary_nakshatra: '' as Nakshatra | '',
    // Address
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    // Business fields
    business_name: '',
    business_ein: '',
  })

  useEffect(() => {
    if (!authMember) return
    fetchMemberData()
  }, [authMember])

  const fetchMemberData = async () => {
    if (!authMember) return

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', authMember.id)
        .single()

      if (error) throw error
      setMember(data)

      // Populate form with existing data
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        primary_email: data.primary_email || '',
        primary_phone: data.primary_phone || '',
        primary_phone_2: data.primary_phone_2 || '',
        nakshatra: data.nakshatra || '',
        family_gotra: data.family_gotra || '',
        secondary_first_name: data.secondary_first_name || '',
        secondary_last_name: data.secondary_last_name || '',
        secondary_email: data.secondary_email || '',
        secondary_phone: data.secondary_phone || '',
        secondary_nakshatra: data.secondary_nakshatra || '',
        address_line_1: data.address_line_1 || '',
        address_line_2: data.address_line_2 || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        country: data.country || 'USA',
        business_name: data.business_name || '',
        business_ein: data.business_ein || '',
      })
    } catch (error) {
      console.error('Error fetching member data:', error)
      setMessage({ type: 'error', text: 'Failed to load profile data' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member) return

    setSaving(true)
    setMessage(null)

    try {
      const updateData: Partial<Member> = {
        primary_phone: formData.primary_phone || null,
        primary_phone_2: formData.primary_phone_2 || null,
        address_line_1: formData.address_line_1 || null,
        address_line_2: formData.address_line_2 || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        country: formData.country || null,
      }

      // Include personal fields if Personal member
      if (member.member_class === 'Personal') {
        updateData.first_name = formData.first_name || null
        updateData.last_name = formData.last_name || null
        updateData.nakshatra = (formData.nakshatra as Nakshatra) || null
        updateData.family_gotra = formData.family_gotra || null
        updateData.secondary_first_name = formData.secondary_first_name || null
        updateData.secondary_last_name = formData.secondary_last_name || null
        updateData.secondary_email = formData.secondary_email || null
        updateData.secondary_phone = formData.secondary_phone || null
        updateData.secondary_nakshatra = (formData.secondary_nakshatra as Nakshatra) || null
      }

      // Include business fields if Business member
      if (member.member_class === 'Business') {
        updateData.business_name = formData.business_name || null
      }

      const { error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', member.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })

      // Refresh member data
      await fetchMemberData()
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!member) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">Unable to load your profile.</p>
            <button
              onClick={() => router.push('/member')}
              className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.push('/member')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update your contact information and preferences
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Membership Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Membership Type</p>
                <p className="text-lg font-bold text-blue-900">
                  {member.member_class} - {member.current_level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Membership ID</p>
                <p className="font-mono font-bold text-blue-900">{member.membership_id}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information (for Personal members) */}
            {member.member_class === 'Personal' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Primary Member Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nakshatra (Birth Star)
                    </label>
                    <select
                      name="nakshatra"
                      value={formData.nakshatra}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    >
                      <option value="">Select Nakshatra</option>
                      {NAKSHATRAS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Family Gotra
                    </label>
                    <input
                      type="text"
                      name="family_gotra"
                      value={formData.family_gotra}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      placeholder="e.g., Bharadwaja"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Business Information (for Business members) */}
            {member.member_class === 'Business' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Business Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business EIN
                    </label>
                    <input
                      type="text"
                      name="business_ein"
                      value={formData.business_ein}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Contact office to update EIN</p>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="primary_email"
                    value={formData.primary_email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Contact office to change email</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Phone
                  </label>
                  <input
                    type="tel"
                    name="primary_phone"
                    value={formData.primary_phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    name="primary_phone_2"
                    value={formData.primary_phone_2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Secondary Contact (Spouse) - for Personal members only */}
            {member.member_class === 'Personal' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Secondary Member (Spouse/Partner)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="secondary_first_name"
                      value={formData.secondary_first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="secondary_last_name"
                      value={formData.secondary_last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="secondary_email"
                      value={formData.secondary_email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="secondary_phone"
                      value={formData.secondary_phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nakshatra (Birth Star)
                    </label>
                    <select
                      name="secondary_nakshatra"
                      value={formData.secondary_nakshatra}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    >
                      <option value="">Select Nakshatra</option>
                      {NAKSHATRAS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Mailing Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="address_line_1"
                    value={formData.address_line_1}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    placeholder="Street address"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="address_line_2"
                    value={formData.address_line_2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    placeholder="Apt, Suite, Unit, etc. (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    placeholder="FL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    placeholder="32256"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/member')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
