'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MembershipPass } from '@/components/member/MembershipPass'
import { MembershipSwitcher } from '@/components/member/MembershipSwitcher'
import { ZellePendingPayments } from '@/components/zelle/ZellePendingPayments'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
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
      <>
        <div className="flex items-center justify-center bg-transparent">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading your membership...</p>
          </div>
        </div>
      </>
    )
  }

  if (!member) {
    return (
      <>
        <div className="flex items-center justify-center bg-transparent">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Membership Found</h1>
            <p className="text-gray-600 mb-6">
              Your account is not yet linked to a membership. Please contact the office for assistance.
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="bg-transparent">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Membership</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {member.member_class === 'Personal' ? member.first_name : member.business_name}!
                </p>
              </div>
              <div className="flex items-center gap-3">
                <MembershipSwitcher />
                {hasAdminAccess && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="text-sm text-saffron hover:text-saffron-hover font-medium"
                  >
                    Admin Portal →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Membership Status Banner */}
          <div className={`mb-5 rounded-lg p-3 ${
            status.color === 'green' ? 'bg-green-50 border border-green-200' :
            status.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
            status.color === 'red' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Membership Status</p>
                <p className={`text-base font-bold ${
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
                  className="px-4 py-2 bg-saffron hover:bg-saffron-hover text-white text-sm font-semibold rounded-md shadow-sm transition-colors"
                >
                  Renew Membership
                </button>
              )}
              {member.current_level === 'Community' && (
                <button
                  onClick={() => router.push('/member/renew')}
                  className="px-4 py-2 bg-saffron hover:bg-saffron-hover text-white text-sm font-semibold rounded-md shadow-sm transition-colors"
                >
                  Upgrade Membership
                </button>
              )}
            </div>
          </div>

          {/* Membership Pass */}
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Membership Pass</h2>
            <MembershipPass
              member={member}
              familyMembers={familyMembers}
              qrToken={qrToken}
            />
          </div>

          {/* Pending Zelle Payments */}
          <div className="mb-5">
            <ZellePendingPayments memberId={member.id} compact />
          </div>

          {/* Quick Actions Grid */}
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <button
                onClick={() => router.push('/member/profile')}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-2xl mb-1">👤</div>
                <h3 className="text-sm font-semibold text-gray-900">Edit Profile</h3>
                <p className="text-xs text-gray-600">Update contact info</p>
              </button>

              {member.member_class === 'Personal' && (
                <button
                  onClick={() => router.push('/member/family')}
                  className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
                >
                  <div className="text-2xl mb-1">👨‍👩‍👧‍👦</div>
                  <h3 className="text-sm font-semibold text-gray-900">Manage Family</h3>
                  <p className="text-xs text-gray-600">Add or edit members</p>
                </button>
              )}

              <button
                onClick={() => router.push('/member/payments')}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-2xl mb-1">💳</div>
                <h3 className="text-sm font-semibold text-gray-900">Payments</h3>
                <p className="text-xs text-gray-600">View history & receipts</p>
              </button>

              <button
                onClick={() => router.push('/member/events')}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-2xl mb-1">🎫</div>
                <h3 className="text-sm font-semibold text-gray-900">Events</h3>
                <p className="text-xs text-gray-600">Register for events</p>
              </button>

              <button
                onClick={() => router.push('/member/donate')}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-2xl mb-1">🙏</div>
                <h3 className="text-sm font-semibold text-gray-900">Donations</h3>
                <p className="text-xs text-gray-600">Support HSNEF</p>
              </button>

              <button
                onClick={() => router.push('/member/requests')}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-2xl mb-1">📋</div>
                <h3 className="text-sm font-semibold text-gray-900">Requests</h3>
                <p className="text-xs text-gray-600">Service requests</p>
              </button>

              <button
                onClick={() => router.push('/member/activity')}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-2xl mb-1">📊</div>
                <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
                <p className="text-xs text-gray-600">Visits & services</p>
              </button>
            </div>
          </div>

          {/* Recent Activity Placeholder */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-base font-bold text-gray-900 mb-2">Recent Activity</h2>
            <p className="text-gray-500 text-sm">
              No recent activity. Your temple visits and service bookings will appear here.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
