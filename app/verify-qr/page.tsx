'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'
import { verifyQRToken } from '@/lib/qr-token'
import type { Member, FamilyMember } from '@/types/database'

function VerifyQRContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])

  const supabase = createClient()

  useEffect(() => {
    const verifyAndFetch = async () => {
      if (!token) {
        setError('No QR token provided')
        setLoading(false)
        return
      }

      try {
        // Verify the JWT token
        const payload = verifyQRToken(token)

        // Fetch member details
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('id', payload.memberId)
          .single()

        if (memberError) throw memberError
        setMember(memberData)

        // Fetch family members if Personal
        if (memberData.member_class === 'Personal') {
          const { data: familyData } = await supabase
            .from('family_members')
            .select('*')
            .eq('member_id', memberData.id)
            .order('created_at', { ascending: false})

          setFamilyMembers(familyData || [])
        }
      } catch (err) {
        console.error('Error verifying QR:', err)
        setError(err instanceof Error ? err.message : 'Failed to verify QR code')
      } finally {
        setLoading(false)
      }
    }

    verifyAndFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Verifying QR code...</p>
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h1>
            <p className="text-gray-600">{error || 'Member not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  const getMembershipColor = () => {
    switch (member.current_level) {
      case 'Lifetime': return 'bg-amber-500'
      case 'Annual': return 'bg-blue-500'
      case 'Community': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const displayName = member.member_class === 'Personal'
    ? `${member.first_name} ${member.last_name}`
    : member.business_name

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className={`${getMembershipColor()} px-6 py-4 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl mb-2">✅</div>
                <h1 className="text-2xl font-bold">Valid Membership</h1>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Membership Type</p>
                <p className="text-3xl font-bold">{member.current_level.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Member Details */}
          <div className="p-6 space-y-6">
            {/* Primary Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Member Name</p>
                <p className="text-2xl font-bold text-gray-900">{displayName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Membership ID</p>
                <p className="text-2xl font-mono font-bold text-[#FF9933]">{member.membership_id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Type</p>
                <p className="text-lg font-semibold text-gray-900">{member.member_class}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <p className="text-lg font-semibold text-green-600">
                  {member.current_level === 'Lifetime' ? 'Active (No Expiry)' : 'Active'}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-gray-900">{member.primary_email}</p>
                </div>
                {member.primary_phone && (
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="text-gray-900">{member.primary_phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Family Members */}
            {member.member_class === 'Personal' && familyMembers.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Members</h3>
                <div className="space-y-2">
                  {familyMembers.map((family) => (
                    <div key={family.id} className="flex items-center py-2 border-b border-gray-100 last:border-0">
                      <div className="w-3 h-3 bg-[#FF9933] rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {family.first_name} {family.last_name}
                        </p>
                        {family.relationship && (
                          <p className="text-sm text-gray-500">{family.relationship}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Secondary Contact */}
            {member.member_class === 'Personal' && member.secondary_first_name && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Spouse/Partner</h3>
                <p className="text-gray-900">
                  {member.secondary_first_name} {member.secondary_last_name}
                </p>
                {member.secondary_email && (
                  <p className="text-sm text-gray-600 mt-1">{member.secondary_email}</p>
                )}
              </div>
            )}

            {/* Founding Member Badge */}
            {member.is_founding_member && (
              <div className="border-t border-gray-200 pt-6">
                <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-lg">
                  <span className="text-2xl mr-2">⭐</span>
                  <span className="font-bold">FOUNDING MEMBER</span>
                </div>
              </div>
            )}
          </div>

          {/* Staff Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Staff Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium">
                ✓ Check In
              </button>
              <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium">
                📅 Book Service
              </button>
              <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium">
                💳 Record Payment
              </button>
              <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium">
                📊 View History
              </button>
            </div>
          </div>
        </div>

        {/* Close/Done Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.close()}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VerifyQRPage() {
  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
        </div>
      }>
        <VerifyQRContent />
      </Suspense>
    </ProtectedRoute>
  )
}
