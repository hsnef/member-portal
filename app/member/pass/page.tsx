'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MembershipPass } from '@/components/member/MembershipPass'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Member, FamilyMember } from '@/types/database'

export default function MemberPassPage() {
  const router = useRouter()
  const { user, member: authMember } = useAuth()
  const [member, setMember] = useState<Member | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
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
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('id', authMember.id)
          .single()

        if (memberError) throw memberError
        setMember(memberData)

        if (memberData.member_class === 'Personal') {
          const { data: familyData } = await supabase
            .from('family_members')
            .select('*')
            .eq('member_id', memberData.id)
            .order('created_at', { ascending: false })

          setFamilyMembers(familyData || [])
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
  }, [user, authMember, supabase])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading pass...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!member) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white p-4">
          <div className="text-center">
            <p className="text-gray-600">No membership found</p>
            <button
              onClick={() => router.push('/member')}
              className="mt-4 text-saffron hover:underline"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4 pt-6">
        {/* Minimal header */}
        <div className="max-w-xl mx-auto mb-4">
          <button
            onClick={() => router.push('/member')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
        </div>

        {/* Membership Pass */}
        <MembershipPass
          member={member}
          familyMembers={familyMembers}
          qrToken={qrToken}
        />

        {/* Refresh hint */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Pull down to refresh
        </p>
      </div>
    </ProtectedRoute>
  )
}
