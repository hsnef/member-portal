'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MembershipPass } from '@/components/member/MembershipPass'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { generateQRToken } from '@/lib/qr-token'
import type { Member, FamilyMember, Membership, UserRole } from '@/types/database'

export default function MemberDashboard() {
  const router = useRouter()
  const { user, member: authMember } = useAuth()
  const [member, setMember] = useState<Member | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null)
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
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

        // Fetch user roles to determine if user can access admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)

        if (roleData) {
          setUserRoles(roleData.map(r => r.role))
        }

        // Generate QR token
        const token = generateQRToken({
          membershipId: memberData.membership_id,
          memberId: memberData.id,
          memberClass: memberData.member_class,
          level: memberData.current_level,
        })
        setQrToken(token)

      } catch (err) {
        console.error('Error fetching member data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMemberData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authMember])

  // Check if user has any staff/admin roles
  const hasAdminAccess = userRoles.some(role =>
    role === 'Admin' || role === 'Office Manager' || role === 'Office Staff'
  )

  // Calculate membership status using actual membership record
  const getMembershipStatus = () => {
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading your membership...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Membership Found</h1>
            <p className="text-gray-600 mb-6">
              Your account is not yet linked to a membership. Please contact the office for assistance.
            </p>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Membership</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Welcome back, {member.member_class === 'Personal' ? member.first_name : member.business_name}!
                </p>
              </div>
              {hasAdminAccess && (
                <button
                  onClick={() => router.push('/admin')}
                  className="text-sm text-[#FF9933] hover:text-[#E68A2E] font-medium"
                >
                  Admin Portal →
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Membership Status Banner */}
          <div className={`mb-8 rounded-lg p-4 ${
            status.color === 'green' ? 'bg-green-50 border border-green-200' :
            status.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
            status.color === 'red' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Membership Status</p>
                <p className={`text-lg font-bold ${
                  status.color === 'green' ? 'text-green-800' :
                  status.color === 'yellow' ? 'text-yellow-800' :
                  status.color === 'red' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {status.status}
                </p>
              </div>
              {member.current_level === 'Annual' && status.color !== 'green' && (
                <button
                  onClick={() => router.push('/member/renew')}
                  className="px-6 py-3 bg-[#FF9933] hover:bg-[#E68A2E] text-white font-semibold rounded-lg shadow-md transition-colors"
                >
                  Renew Membership
                </button>
              )}
              {member.current_level === 'Community' && (
                <button
                  onClick={() => router.push('/member/renew')}
                  className="px-6 py-3 bg-[#FF9933] hover:bg-[#E68A2E] text-white font-semibold rounded-lg shadow-md transition-colors"
                >
                  Upgrade Membership
                </button>
              )}
            </div>
          </div>

          {/* Membership Pass */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Membership Pass</h2>
            <MembershipPass
              member={member}
              familyMembers={familyMembers}
              qrToken={qrToken}
            />
          </div>

          {/* Quick Actions Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/member/profile')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">👤</div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                <p className="text-sm text-gray-600 mt-1">Update your contact information</p>
              </button>

              {member.member_class === 'Personal' && (
                <button
                  onClick={() => router.push('/member/family')}
                  className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
                >
                  <div className="text-3xl mb-2">👨‍👩‍👧‍👦</div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Family</h3>
                  <p className="text-sm text-gray-600 mt-1">Add or edit family members</p>
                </button>
              )}

              <button
                onClick={() => router.push('/member/payments')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">💳</div>
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                <p className="text-sm text-gray-600 mt-1">View past payments and receipts</p>
              </button>

              <button
                onClick={() => router.push('/member/events')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">🎫</div>
                <h3 className="text-lg font-semibold text-gray-900">Events</h3>
                <p className="text-sm text-gray-600 mt-1">Register for upcoming events</p>
              </button>

              <button
                onClick={() => router.push('/member/donate')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">🙏</div>
                <h3 className="text-lg font-semibold text-gray-900">Donations</h3>
                <p className="text-sm text-gray-600 mt-1">Make a donation to HSNEF</p>
              </button>

              <button
                onClick={() => router.push('/member/requests')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">📋</div>
                <h3 className="text-lg font-semibold text-gray-900">Service Requests</h3>
                <p className="text-sm text-gray-600 mt-1">View your service requests and invoices</p>
              </button>

              <button
                onClick={() => router.push('/member/activity')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">📊</div>
                <h3 className="text-lg font-semibold text-gray-900">Activity</h3>
                <p className="text-sm text-gray-600 mt-1">View your temple visits and services</p>
              </button>
            </div>
          </div>

          {/* Recent Activity Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <p className="text-gray-500 text-sm">
              No recent activity. Your temple visits and service bookings will appear here.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
