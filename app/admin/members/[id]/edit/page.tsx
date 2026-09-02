'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { PhoneInput, EINInput, ZipInput } from '@/components/ui/FormattedInputs'
import type { Member, MemberClass, MembershipLevel, Nakshatra } from '@/types/database'
import { AdminFormView, FormSection } from '@/components/admin/AdminFormView'
import { MemberFormFields } from '@/components/admin/MemberFormFields'
import { MailIcon } from 'lucide-react'

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

  return (
    <AdminFormView
      eyebrow="Members"
      title="Edit member"
      description="Changes are recorded in this member\'s change history."
      backHref="/admin/members"
      onSubmit={handleSubmit(onSubmit)}
      saving={saving}
      saveLabel="Save changes"
      error={error}
      loading={loading}
    >
      <MemberFormFields register={register} errors={errors} memberClass={memberClass} />
    </AdminFormView>
  )
}
