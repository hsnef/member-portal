'use client'

import { useEffect, useState } from 'react'
import {
  MemberDashboard as MemberDashboardView,
  type MembershipStatus,
} from '@/components/member/MemberDashboard'
import { Skeleton } from '@/components/ui/Skeleton'
import { useRouter } from 'next/navigation'
import { NoMembershipState } from '@/components/member/NoMembershipState'
import { STAFF_ROLES } from '@/lib/navigation'
import { shouldSendToOfficeConsole } from '@/lib/auth/staffLanding'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Member, FamilyMember, Membership } from '@/types/database'

export default function MemberDashboard() {
  const { user, member: authMember, loading: authLoading, hasAnyRole } = useAuth()
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null)
  const [qrToken, setQrToken] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!user || !authMember) {
        setLoading(false)
        return
      }

      try {
        // Fetch full member details
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('id', authMember.id)
          .single()

        if (memberError) throw memberError
        setMember(memberData)

        // Fetch family members if Personal
        if (memberData.member_class === 'Personal') {
          const { data: familyData } = await supabase
            .from('family_members')
            .select('*')
            .eq('member_id', memberData.id)
            .order('created_at', { ascending: false })

          setFamilyMembers(familyData || [])
        }

        // Fetch active membership record for expiry date
        const { data: membershipData } = await supabase
          .from('memberships')
          .select('*')
          .eq('member_id', memberData.id)
          .eq('status', 'Active')
          .order('end_date', { ascending: false })
          .limit(1)
          .single()

        if (membershipData) {
          setActiveMembership(membershipData)
        }

        // Generate QR token via API (server-side only)
        try {
          const qrResponse = await fetch(`/api/members/${memberData.id}/qr-token`)
          if (qrResponse.ok) {
            const qrData = await qrResponse.json()
            setQrToken(qrData.token)
          }
        } catch (qrError) {
          console.error('Error fetching QR token:', qrError)
        }

      } catch (err) {
        console.error('Error fetching member data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMemberData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authMember])

  // Calculate membership status using actual membership record
  const getMembershipStatus = (): MembershipStatus => {
    if (!member) return { status: 'Unknown', color: 'gray', daysUntilExpiry: null }

    if (member.current_level === 'Lifetime') {
      return { status: 'Active (Lifetime)', color: 'green', daysUntilExpiry: null }
    }

    // For Annual/Community, check actual membership end date from database
    const now = new Date()

    if (activeMembership && activeMembership.end_date) {
      // Use actual end_date from membership record
      const endDate = new Date(activeMembership.end_date)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (member.current_level === 'Annual') {
        if (daysUntilExpiry > 60) {
          return { status: 'Active', color: 'green', daysUntilExpiry }
        } else if (daysUntilExpiry > 0) {
          return { status: `Expiring in ${daysUntilExpiry} days`, color: 'yellow', daysUntilExpiry }
        } else {
          return { status: 'Expired - Renew Now', color: 'red', daysUntilExpiry }
        }
      }
    } else {
      // Fallback to end of year if no membership record found
      const currentYear = now.getFullYear()
      const endOfYear = new Date(currentYear, 11, 31) // Dec 31
      const daysUntilExpiry = Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (member.current_level === 'Annual') {
        if (daysUntilExpiry > 60) {
          return { status: 'Active', color: 'green', daysUntilExpiry }
        } else if (daysUntilExpiry > 0) {
          return { status: `Expiring in ${daysUntilExpiry} days`, color: 'yellow', daysUntilExpiry }
        } else {
          return { status: 'Expired - Renew Now', color: 'red', daysUntilExpiry }
        }
      }
    }

    return { status: 'Community', color: 'blue', daysUntilExpiry: null }
  }

  const status = getMembershipStatus()

  // Staff sign in to the member home like everyone else (the default
  // redirect is /member). A staff account with no membership has nothing to
  // see here, so it goes on to the office console instead.
  const isStaff = hasAnyRole(STAFF_ROLES)
  useEffect(() => {
    if (
      shouldSendToOfficeConsole({
        authLoading,
        memberLoading: loading,
        hasMembership: !!member,
        isStaff,
      })
    ) {
      router.replace('/admin')
    }
  }, [loading, authLoading, member, isStaff, router])

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading your membership…</span>
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!member) {
    // A staff account with no membership is sent on to /admin by the effect
    // above; this is what everyone else sees, and what staff see for the
    // moment before the redirect.
    return <NoMembershipState />
  }

  return (
    <MemberDashboardView
      member={member}
      familyMembers={familyMembers}
      qrToken={qrToken}
      status={status}
      membershipEndDate={activeMembership?.end_date ?? null}
    />
  )
}
