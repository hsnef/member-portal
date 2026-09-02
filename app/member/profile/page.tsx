'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { ProfileView, type ProfileFormData } from '@/components/member/ProfileView'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { UserXIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPhoneNumber, formatZipCode } from '@/lib/utils/formatters'
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

    // Format phone fields
    if (name === 'primary_phone' || name === 'primary_phone_2' || name === 'secondary_phone') {
      const formatted = formatPhoneNumber(value)
      setFormData((prev) => ({ ...prev, [name]: formatted }))
      return
    }

    // Format ZIP field
    if (name === 'zip') {
      const formatted = formatZipCode(value)
      setFormData((prev) => ({ ...prev, [name]: formatted }))
      return
    }

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
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading your profile…</span>
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!member) {
    return (
      <EmptyState
        icon={UserXIcon}
        title="No membership found"
        description="Your account is not yet linked to a membership, so there is no profile to edit."
        action={
          <AppLink to="/member">
            <Button>Back to my portal</Button>
          </AppLink>
        }
      />
    )
  }

  return (
    <ProfileView
      member={member}
      formData={formData as ProfileFormData}
      nakshatras={NAKSHATRAS}
      onChange={handleInputChange}
      onSubmit={handleSubmit}
      saving={saving}
      message={message}
    />
  )
}
