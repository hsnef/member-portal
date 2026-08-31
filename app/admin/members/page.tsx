'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import type { Member, MembershipLevel } from '@/types/database'
import { useTestData } from '@/lib/context/TestDataContext'
import { getTestMemberIds } from '@/lib/utils/testDataFiltering'

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<MembershipLevel | 'All'>('All')
  const { showTestData } = useTestData()

  const supabase = createClient()

  const fetchMembers = async () => {
    try {
      setLoading(true)

      // Get test member IDs for filtering
      const testMemberIds = await getTestMemberIds()

      let query = supabase.from('members').select('*').order('created_at', { ascending: false })

      // Filter out test members unless showTestData toggle is ON
      if (!showTestData && testMemberIds.length > 0) {
        query = query.not('id', 'in', `(${testMemberIds.join(',')})`)
      }

      // Apply level filter
      if (levelFilter !== 'All') {
        query = query.eq('current_level', levelFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching members:', error)
      } else {
        // Mark test members for badge display
        const membersWithTestFlag = (data || []).map((member) => ({
          ...member,
          is_test_member: testMemberIds.includes(member.id),
        }))
        setMembers(membersWithTestFlag)
      }
    } catch (error) {
      console.error('Error in fetchMembers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, showTestData])

  // Filter members by search term
  const filteredMembers = members.filter((member) => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()
    return (
      member.membership_id.toLowerCase().includes(search) ||
      member.first_name?.toLowerCase().includes(search) ||
      member.last_name?.toLowerCase().includes(search) ||
      member.business_name?.toLowerCase().includes(search) ||
      member.primary_email?.toLowerCase().includes(search) ||
      member.primary_phone?.toLowerCase().includes(search)
    )
  })

  const getLevelBadgeColor = (level: MembershipLevel) => {
    switch (level) {
      case 'Lifetime':
        return 'bg-saffron text-white'
      case 'Annual':
        return 'bg-blue-500 text-white'
      case 'Community':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Members</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and view all member records
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/members/import"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-ring"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Import CSV
              </Link>
              <Link
                href="/admin/members/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-kumkum focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-ring"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Member
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by ID, name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                />
              </div>

              {/* Level Filter */}
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                  Membership Level
                </label>
                <select
                  id="level"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as MembershipLevel | 'All')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                >
                  <option value="All">All Levels</option>
                  <option value="Lifetime">Lifetime</option>
                  <option value="Annual">Annual</option>
                  <option value="Community">Community</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredMembers.length} of {members.length} members
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || levelFilter !== 'All'
                    ? 'Try adjusting your filters'
                    : 'Get started by adding a new member'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.membership_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {member.member_class === 'Personal'
                                  ? `${member.first_name || ''} ${member.last_name || ''}`
                                  : member.business_name}
                              </div>
                              {member.member_profile_name && (
                                <div className="text-sm text-gray-500">{member.member_profile_name}</div>
                              )}
                            </div>
                            {member.is_test_member && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 whitespace-nowrap">
                                🧪 TEST
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.member_class}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(
                              member.current_level
                            )}`}
                          >
                            {member.current_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.primary_email}</div>
                          <div className="text-sm text-gray-500">{member.primary_phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/members/${member.id}`}
                            className="text-saffron hover:text-[#FF8800]"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
