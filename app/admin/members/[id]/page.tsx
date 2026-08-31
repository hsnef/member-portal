'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FamilyMembersSection } from '@/components/admin/FamilyMembersSection'
import { createClient } from '@/lib/supabase/client'
import type { Member, FamilyMember, Membership } from '@/types/database'

export default function MemberDetailPage() {
  const params = useParams()
  const memberId = params.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  const fetchMemberData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single()

      if (memberError) throw memberError
      setMember(memberData)

      // Fetch family members (if Personal)
      if (memberData.member_class === 'Personal') {
        const { data: familyData } = await supabase
          .from('family_members')
          .select('*')
          .eq('member_id', memberId)
          .order('created_at', { ascending: false })

        setFamilyMembers(familyData || [])
      }

      // Fetch membership history
      const { data: membershipData } = await supabase
        .from('memberships')
        .select('*')
        .eq('member_id', memberId)
        .order('start_date', { ascending: false })

      setMemberships(membershipData || [])

    } catch (err) {
      console.error('Error fetching member:', err)
      setError(err instanceof Error ? err.message : 'Failed to load member')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemberData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Lifetime':
        return 'bg-saffron text-white'
      case 'Annual':
        return 'bg-blue-500 text-white'
      case 'Community':
        return 'bg-transparent0 text-white'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  const handleSendInvitation = async () => {
    if (!member) return

    try {
      setSendingEmail(true)
      setEmailMessage(null)

      const response = await fetch('/api/members/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setEmailMessage({ type: 'success', text: 'Invitation email sent successfully!' })

      // Clear message after 5 seconds
      setTimeout(() => setEmailMessage(null), 5000)
    } catch (err) {
      console.error('Error sending invitation:', err)
      setEmailMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send invitation email'
      })
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading member details...</p>
          </div>
        </div>
      </>
    )
  }

  if (error || !member) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Member</h2>
            <p className="text-red-600">{error || 'Member not found'}</p>
            <Link
              href="/admin/members"
              className="mt-4 inline-block text-saffron hover:text-[#FF8800] font-medium"
            >
              ← Back to Members
            </Link>
          </div>
        </div>
      </>
    )
  }

  const memberName = member.member_class === 'Personal'
    ? `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unnamed Member'
    : member.business_name || 'Unnamed Business'

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/members"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              ← Back to Members
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{memberName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getLevelBadgeColor(
                  member.current_level
                )}`}
              >
                {member.current_level}
              </span>
              <span className="text-sm text-gray-500">
                ID: {member.membership_id}
              </span>
              {member.is_founding_member && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  ⭐ Founding Member
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/members/${member.id}/edit`}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-transparent transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleSendInvitation}
              disabled={sendingEmail}
              className="px-4 py-2 bg-kumkum text-white rounded-md hover:from-[#FF8800] hover:to-[#700000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>

        {/* Email Message */}
        {emailMessage && (
          <div className={`p-4 rounded-md ${emailMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {emailMessage.text}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Member Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {member.member_class === 'Personal' ? 'Personal Information' : 'Business Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.member_class === 'Personal' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">First Name</label>
                      <p className="mt-1 text-gray-900">{member.first_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Name</label>
                      <p className="mt-1 text-gray-900">{member.last_name || 'N/A'}</p>
                    </div>
                    {member.member_profile_name && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-500">Profile Name</label>
                        <p className="mt-1 text-gray-900">{member.member_profile_name}</p>
                      </div>
                    )}
                    {member.nakshatra && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nakshatra</label>
                        <p className="mt-1 text-gray-900">{member.nakshatra}</p>
                      </div>
                    )}
                    {member.family_gotra && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Gotra</label>
                        <p className="mt-1 text-gray-900">{member.family_gotra}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Business Name</label>
                      <p className="mt-1 text-gray-900">{member.business_name || 'N/A'}</p>
                    </div>
                    {member.business_ein && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">EIN</label>
                        <p className="mt-1 text-gray-900">{member.business_ein}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Primary Email</label>
                  <p className="mt-1 text-gray-900">
                    <a href={`mailto:${member.primary_email}`} className="text-saffron hover:text-[#FF8800]">
                      {member.primary_email}
                    </a>
                  </p>
                </div>
                {member.primary_phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Primary Phone</label>
                    <p className="mt-1 text-gray-900">
                      <a href={`tel:${member.primary_phone}`} className="text-saffron hover:text-[#FF8800]">
                        {member.primary_phone}
                      </a>
                    </p>
                  </div>
                )}
                {member.primary_phone_2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Secondary Phone</label>
                    <p className="mt-1 text-gray-900">{member.primary_phone_2}</p>
                  </div>
                )}
              </div>

              {/* Secondary Contact (for Personal) */}
              {member.member_class === 'Personal' && (member.secondary_first_name || member.secondary_email) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Secondary Contact / Spouse</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {member.secondary_first_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Name</label>
                        <p className="mt-1 text-gray-900">
                          {member.secondary_first_name} {member.secondary_last_name || ''}
                        </p>
                      </div>
                    )}
                    {member.secondary_nakshatra && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nakshatra</label>
                        <p className="mt-1 text-gray-900">{member.secondary_nakshatra}</p>
                      </div>
                    )}
                    {member.secondary_email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 text-gray-900">
                          <a href={`mailto:${member.secondary_email}`} className="text-saffron hover:text-[#FF8800]">
                            {member.secondary_email}
                          </a>
                        </p>
                      </div>
                    )}
                    {member.secondary_phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                        <p className="mt-1 text-gray-900">{member.secondary_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            {(member.address_line_1 || member.city) && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
                <div className="space-y-2 text-gray-900">
                  {member.address_line_1 && <p>{member.address_line_1}</p>}
                  {member.address_line_2 && <p>{member.address_line_2}</p>}
                  {(member.city || member.state || member.zip) && (
                    <p>
                      {member.city && `${member.city}, `}
                      {member.state && `${member.state} `}
                      {member.zip}
                    </p>
                  )}
                  {member.country && <p>{member.country}</p>}
                </div>
                {member.mailing_address && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Mailing Address (if different)</label>
                    <p className="text-gray-900 whitespace-pre-line">{member.mailing_address}</p>
                  </div>
                )}
              </div>
            )}

            {/* Family Members */}
            {member.member_class === 'Personal' && (
              <FamilyMembersSection
                memberId={memberId}
                familyMembers={familyMembers}
                onRefresh={fetchMemberData}
              />
            )}

            {/* Membership History */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Membership History</h2>
              {memberships.length === 0 ? (
                <p className="text-gray-500 text-sm">No membership records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-transparent">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {memberships.map((membership) => (
                        <tr key={membership.id}>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(
                                membership.level
                              )}`}
                            >
                              {membership.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{membership.year || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatDate(membership.start_date)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatDate(membership.end_date)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">${membership.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Info & Actions */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Member Type</label>
                  <p className="mt-1 text-gray-900">{member.member_class}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Membership Level</label>
                  <p className="mt-1 text-gray-900">{member.current_level}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Membership ID</label>
                  <p className="mt-1 text-gray-900 font-mono">{member.membership_id}</p>
                </div>
                {member.member_since && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Member Since</label>
                    <p className="mt-1 text-gray-900">{formatDate(member.member_since)}</p>
                  </div>
                )}
                {member.legacy_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Legacy ID</label>
                    <p className="mt-1 text-gray-900">{member.legacy_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href={`/admin/members/${memberId}/edit`}
                  className="block w-full text-left px-4 py-2 text-sm text-white bg-saffron hover:bg-saffron-hover rounded-md transition-colors"
                >
                  ✏️ Edit Member
                </Link>
                <Link
                  href={`/admin/members/${memberId}/audit-log`}
                  className="block w-full text-left px-4 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  📋 View Audit Log
                </Link>
                <Link
                  href={`/admin/members/${memberId}/login-activity`}
                  className="block w-full text-left px-4 py-2 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                >
                  🔐 View Login Activity
                </Link>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-transparent rounded-md transition-colors">
                  📧 Send Registration Invite
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-transparent rounded-md transition-colors">
                  💳 Record Payment
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-transparent rounded-md transition-colors">
                  📄 View Receipts
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-transparent rounded-md transition-colors">
                  📊 View Payment History
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-transparent rounded-md transition-colors">
                  🎫 View Event Registrations
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-transparent shadow rounded-lg p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Record Information</h2>
              <div className="space-y-2 text-xs text-gray-600">
                <p>Created: {formatDate(member.created_at)}</p>
                <p>Updated: {formatDate(member.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
