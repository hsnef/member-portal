'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import type { MemberClass, MembershipLevel, Nakshatra } from '@/types/database'

// Validation schema
const memberSchema = z.object({
  member_class: z.enum(['Personal', 'Business']),
  current_level: z.enum(['Community', 'Annual', 'Lifetime']),
  is_founding_member: z.boolean(),

  // Personal fields
  first_name: z.string().min(1, 'First name is required').optional().or(z.literal('')),
  last_name: z.string().min(1, 'Last name is required').optional().or(z.literal('')),
  profile_name: z.string().optional().or(z.literal('')),
  nakshatra: z.string().optional().or(z.literal('')),
  family_gotra: z.string().optional().or(z.literal('')),

  // Secondary/spouse fields
  secondary_first_name: z.string().optional().or(z.literal('')),
  secondary_last_name: z.string().optional().or(z.literal('')),
  secondary_nakshatra: z.string().optional().or(z.literal('')),
  secondary_email: z.string().email('Invalid email').optional().or(z.literal('')),
  secondary_phone: z.string().optional().or(z.literal('')),

  // Business fields
  business_name: z.string().optional().or(z.literal('')),
  business_ein: z.string().optional().or(z.literal('')),

  // Contact
  primary_email: z.string().email('Invalid email'),
  primary_phone: z.string().optional().or(z.literal('')),
  primary_phone_2: z.string().optional().or(z.literal('')),

  // Address
  address_line_1: z.string().optional().or(z.literal('')),
  address_line_2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zip: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('USA')),
  mailing_address: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    // Personal members must have first and last name
    if (data.member_class === 'Personal') {
      return data.first_name && data.last_name
    }
    return true
  },
  {
    message: 'First and last name are required for Personal members',
    path: ['first_name'],
  }
).refine(
  (data) => {
    // Business members must have business name
    if (data.member_class === 'Business') {
      return data.business_name
    }
    return true
  },
  {
    message: 'Business name is required for Business members',
    path: ['business_name'],
  }
)

type MemberFormData = z.infer<typeof memberSchema>

const NAKSHATRAS: Nakshatra[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshta',
  'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
]

export default function NewMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendInvitation, setSendInvitation] = useState(true)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      member_class: 'Personal',
      current_level: 'Annual',
      is_founding_member: false,
      country: 'USA',
    },
  })

  const memberClass = watch('member_class')

  const onSubmit = async (data: MemberFormData) => {
    try {
      setLoading(true)
      setError(null)

      // Create member record
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert({
          member_class: data.member_class,
          current_level: data.current_level,
          is_founding_member: data.is_founding_member,

          // Personal fields
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          profile_name: data.profile_name || null,
          nakshatra: (data.nakshatra as Nakshatra) || null,
          family_gotra: data.family_gotra || null,

          // Secondary/spouse
          secondary_first_name: data.secondary_first_name || null,
          secondary_last_name: data.secondary_last_name || null,
          secondary_nakshatra: (data.secondary_nakshatra as Nakshatra) || null,
          secondary_email: data.secondary_email || null,
          secondary_phone: data.secondary_phone || null,

          // Business fields
          business_name: data.business_name || null,
          business_ein: data.business_ein || null,

          // Contact
          primary_email: data.primary_email,
          primary_phone: data.primary_phone || null,
          primary_phone_2: data.primary_phone_2 || null,

          // Address
          address_line_1: data.address_line_1 || null,
          address_line_2: data.address_line_2 || null,
          city: data.city || null,
          state: data.state || null,
          zip: data.zip || null,
          country: data.country || 'USA',
          mailing_address: data.mailing_address || null,

          member_since: new Date().toISOString(),
        })
        .select()
        .single()

      if (memberError) throw memberError

      // Send invitation email if requested
      if (sendInvitation) {
        try {
          await fetch('/api/members/send-invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberId: memberData.id,
            }),
          })
        } catch (emailError) {
          console.warn('Failed to send invitation email:', emailError)
        }
      }

      // Redirect to member detail page
      router.push(`/admin/members/${memberData.id}`)
    } catch (err) {
      console.error('Error creating member:', err)
      setError(err instanceof Error ? err.message : 'Failed to create member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Add New Member</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create a new member account. MembershipID will be auto-generated.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Member Class & Level */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Type</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Class *
                  </label>
                  <select
                    {...register('member_class')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Business">Business</option>
                  </select>
                  {errors.member_class && (
                    <p className="mt-1 text-sm text-red-600">{errors.member_class.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membership Level *
                  </label>
                  <select
                    {...register('current_level')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                  >
                    <option value="Community">Community</option>
                    <option value="Annual">Annual</option>
                    <option value="Lifetime">Lifetime</option>
                  </select>
                  {errors.current_level && (
                    <p className="mt-1 text-sm text-red-600">{errors.current_level.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('is_founding_member')}
                      className="rounded border-gray-300 text-[#FF9933] focus:ring-[#FF9933]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Founding Member</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            {memberClass === 'Personal' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      {...register('first_name')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      {...register('last_name')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Name
                    </label>
                    <input
                      type="text"
                      {...register('profile_name')}
                      placeholder="Display name"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nakshatra
                    </label>
                    <select
                      {...register('nakshatra')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    >
                      <option value="">Select Nakshatra</option>
                      {NAKSHATRAS.map((nakshatra) => (
                        <option key={nakshatra} value={nakshatra}>
                          {nakshatra}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Gotra
                    </label>
                    <input
                      type="text"
                      {...register('family_gotra')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Business Information */}
            {memberClass === 'Business' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      {...register('business_name')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                    {errors.business_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      EIN (Tax ID)
                    </label>
                    <input
                      type="text"
                      {...register('business_ein')}
                      placeholder="XX-XXXXXXX"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Email *
                  </label>
                  <input
                    type="email"
                    {...register('primary_email')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                  />
                  {errors.primary_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.primary_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Phone
                  </label>
                  <input
                    type="tel"
                    {...register('primary_phone')}
                    placeholder="(555) 123-4567"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Phone
                  </label>
                  <input
                    type="tel"
                    {...register('primary_phone_2')}
                    placeholder="(555) 123-4567"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                  />
                </div>
              </div>
            </div>

            {/* Secondary Contact (for Personal members) */}
            {memberClass === 'Personal' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Secondary Contact (Spouse)
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      {...register('secondary_first_name')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      {...register('secondary_last_name')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nakshatra
                    </label>
                    <select
                      {...register('secondary_nakshatra')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    >
                      <option value="">Select Nakshatra</option>
                      {NAKSHATRAS.map((nakshatra) => (
                        <option key={nakshatra} value={nakshatra}>
                          {nakshatra}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register('secondary_email')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                    {errors.secondary_email && (
                      <p className="mt-1 text-sm text-red-600">{errors.secondary_email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      {...register('secondary_phone')}
                      placeholder="(555) 123-4567"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    {...register('address_line_1')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    {...register('address_line_2')}
                    placeholder="Apt, Suite, Unit, etc."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      {...register('city')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      {...register('state')}
                      placeholder="TX"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      {...register('zip')}
                      placeholder="75001"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    {...register('country')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mailing Address (if different)
                  </label>
                  <textarea
                    {...register('mailing_address')}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF9933] focus:ring-[#FF9933]"
                    placeholder="Full mailing address if different from above"
                  />
                </div>
              </div>
            </div>

            {/* Email Invitation */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Portal Access</h2>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendInvitation}
                  onChange={(e) => setSendInvitation(e.target.checked)}
                  className="rounded border-gray-300 text-[#FF9933] focus:ring-[#FF9933]"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Send registration invitation email to member
                </span>
              </label>
              <p className="mt-2 text-xs text-gray-500">
                If checked, the member will receive an email with a link to create their portal account.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF9933]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF9933] hover:bg-[#E68A2E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF9933] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Member'}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
