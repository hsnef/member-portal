'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { PhoneInput, EINInput, ZipInput } from '@/components/ui/FormattedInputs'
import type { Member, MemberClass, MembershipLevel, Nakshatra } from '@/types/database'

// Validation schema (same as add member)
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

export default function EditMemberPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  })

  const memberClass = watch('member_class')

  // Fetch member data
  useEffect(() => {
    const fetchMember = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberId)
          .single()

        if (error) throw error

        setMember(data)

        // Populate form with existing data
        reset({
          member_class: data.member_class,
          current_level: data.current_level,
          is_founding_member: data.is_founding_member,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          profile_name: data.member_profile_name || '',
          nakshatra: data.nakshatra || '',
          family_gotra: data.family_gotra || '',
          secondary_first_name: data.secondary_first_name || '',
          secondary_last_name: data.secondary_last_name || '',
          secondary_nakshatra: data.secondary_nakshatra || '',
          secondary_email: data.secondary_email || '',
          secondary_phone: data.secondary_phone || '',
          business_name: data.business_name || '',
          business_ein: data.business_ein || '',
          primary_email: data.primary_email,
          primary_phone: data.primary_phone || '',
          primary_phone_2: data.primary_phone_2 || '',
          address_line_1: data.address_line_1 || '',
          address_line_2: data.address_line_2 || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          country: data.country || 'USA',
          mailing_address: data.mailing_address || '',
        })
      } catch (err) {
        console.error('Error fetching member:', err)
        setError(err instanceof Error ? err.message : 'Failed to load member')
      } finally {
        setLoading(false)
      }
    }

    fetchMember()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId])

  const onSubmit = async (data: MemberFormData) => {
    try {
      setSaving(true)
      setError(null)

      // Update member record
      const { error: updateError } = await supabase
        .from('members')
        .update({
          member_class: data.member_class,
          current_level: data.current_level,
          is_founding_member: data.is_founding_member,

          // Personal fields
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          member_profile_name: data.profile_name || null,
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
        })
        .eq('id', memberId)

      if (updateError) throw updateError

      // Redirect back to member detail page
      router.push(`/admin/members/${memberId}`)
    } catch (err) {
      console.error('Error updating member:', err)
      setError(err instanceof Error ? err.message : 'Failed to update member')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading member...</p>
          </div>
        </div>
      </>
    )
  }

  if (error && !member) {
    return (
      <>
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Member</h1>
          <p className="mt-1 text-sm text-gray-600">
            MembershipID: {member?.membership_id}
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                    className="rounded border-gray-300 text-saffron focus:ring-saffron-ring"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nakshatra
                  </label>
                  <select
                    {...register('nakshatra')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                  />
                  {errors.business_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EIN (Tax ID)
                  </label>
                  <EINInput
                    {...register('business_ein')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                />
                {errors.primary_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.primary_email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Phone
                </label>
                <PhoneInput
                  {...register('primary_phone')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Phone
                </label>
                <PhoneInput
                  {...register('primary_phone_2')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...register('secondary_last_name')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nakshatra
                  </label>
                  <select
                    {...register('secondary_nakshatra')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                  />
                  {errors.secondary_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.secondary_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <PhoneInput
                    {...register('secondary_phone')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <ZipInput
                    {...register('zip')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mailing Address (if different)
                </label>
                <textarea
                  {...register('mailing_address')}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                  placeholder="Full mailing address if different from above"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/members/${memberId}`)}
              className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-saffron hover:bg-saffron-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
