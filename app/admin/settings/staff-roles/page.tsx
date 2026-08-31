'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'Admin' | 'Office Manager' | 'Office Staff'

interface StaffMember {
  user_id: string
  member_id: string
  membership_id: string
  first_name: string
  last_name: string
  primary_email: string
  roles: UserRole[]
  is_test_account: boolean
}

interface MemberSearchResult {
  id: string
  membership_id: string
  first_name: string
  last_name: string
  primary_email: string
  auth_user_id: string | null
  is_test_account: boolean
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  'Admin': 'Full system access including settings, role management, and all administrative functions',
  'Office Manager': 'Can manage members, approve bookings, record payments, and access most admin features',
  'Office Staff': 'Can view members, process day-to-day transactions, and handle basic admin tasks',
}

const ROLE_COLORS: Record<UserRole, string> = {
  'Admin': 'bg-red-100 text-red-800',
  'Office Manager': 'bg-purple-100 text-purple-800',
  'Office Staff': 'bg-blue-100 text-blue-800',
}

export default function StaffRolesPage() {
  const supabase = createClient()
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('Office Staff')
  const [assigning, setAssigning] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchStaffMembers()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

  const fetchStaffMembers = async () => {
    try {
      setLoading(true)

      // Fetch all users with roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')

      if (rolesError) throw rolesError

      if (!rolesData || rolesData.length === 0) {
        setStaffMembers([])
        return
      }

      // Group roles by user_id
      const rolesMap: Record<string, UserRole[]> = {}
      rolesData.forEach(({ user_id, role }) => {
        if (!rolesMap[user_id]) {
          rolesMap[user_id] = []
        }
        rolesMap[user_id].push(role as UserRole)
      })

      const userIds = Object.keys(rolesMap)

      // Fetch member details for these users
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, membership_id, first_name, last_name, primary_email, auth_user_id, is_test_account')
        .in('auth_user_id', userIds)

      if (membersError) throw membersError

      const staffList: StaffMember[] = (members || []).map(member => ({
        user_id: member.auth_user_id!,
        member_id: member.id,
        membership_id: member.membership_id,
        first_name: member.first_name,
        last_name: member.last_name,
        primary_email: member.primary_email,
        roles: rolesMap[member.auth_user_id!] || [],
        is_test_account: member.is_test_account || false,
      }))

      // Sort: Admin first, then by name
      staffList.sort((a, b) => {
        const aIsAdmin = a.roles.includes('Admin')
        const bIsAdmin = b.roles.includes('Admin')
        if (aIsAdmin && !bIsAdmin) return -1
        if (!aIsAdmin && bIsAdmin) return 1
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
      })

      setStaffMembers(staffList)
    } catch (error) {
      console.error('Error fetching staff members:', error)
      alert('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)

      const query = searchQuery.trim().toLowerCase()

      // Search for members by name, email, or membership ID
      const { data, error } = await supabase
        .from('members')
        .select('id, membership_id, first_name, last_name, primary_email, auth_user_id, is_test_account')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,primary_email.ilike.%${query}%,membership_id.ilike.%${query}%`)
        .limit(10)

      if (error) throw error

      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching members:', error)
      alert('Failed to search members')
    } finally {
      setSearching(false)
    }
  }

  const handleAssignRole = async () => {
    if (!selectedMember) return

    if (!selectedMember.auth_user_id) {
      alert('This member has not registered yet. They must register first before a role can be assigned.')
      return
    }

    // Check if already has this role
    const existingStaff = staffMembers.find(s => s.user_id === selectedMember.auth_user_id)
    if (existingStaff?.roles.includes(selectedRole)) {
      alert(`${selectedMember.first_name} ${selectedMember.last_name} already has the ${selectedRole} role.`)
      return
    }

    try {
      setAssigning(true)

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedMember.auth_user_id,
          role: selectedRole,
        })

      if (error) throw error

      alert(`Successfully assigned ${selectedRole} role to ${selectedMember.first_name} ${selectedMember.last_name}`)

      // Reset and refresh
      setSelectedMember(null)
      setSearchQuery('')
      setSearchResults([])
      await fetchStaffMembers()
    } catch (error: any) {
      console.error('Error assigning role:', error)
      if (error.code === '23505') {
        alert('This user already has this role.')
      } else {
        alert(`Failed to assign role: ${error.message}`)
      }
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveRole = async (userId: string, role: UserRole, memberName: string, isTestAccount: boolean) => {
    // Safety check for Admin role removal
    if (role === 'Admin') {
      // Count non-test Admins
      const nonTestAdmins = staffMembers.filter(s =>
        s.roles.includes('Admin') && !s.is_test_account
      )

      // Check if this is the last non-test Admin
      if (nonTestAdmins.length === 1 && nonTestAdmins[0].user_id === userId) {
        alert(
          'Cannot remove Admin role!\n\n' +
          'This is the only non-test Admin account. ' +
          'There must always be at least one non-test Admin to manage the system.\n\n' +
          'To remove this Admin role, first assign Admin role to another non-test user.'
        )
        return
      }

      // Check if user is trying to remove their own Admin role
      if (userId === currentUserId) {
        const otherNonTestAdmins = nonTestAdmins.filter(a => a.user_id !== currentUserId)
        if (otherNonTestAdmins.length === 0) {
          alert(
            'Cannot remove your own Admin role!\n\n' +
            'You are the only non-test Admin. ' +
            'Assign Admin role to another non-test user first before removing your own.'
          )
          return
        }

        // Warn about self-removal even if there are other admins
        if (!confirm(
          '⚠️ Warning: You are about to remove your own Admin role!\n\n' +
          'You will lose access to this page and other Admin-only features.\n\n' +
          'Are you sure you want to continue?'
        )) {
          return
        }
      }
    }

    if (!confirm(`Remove ${role} role from ${memberName}?\n\nThis will revoke their ${role} access immediately.`)) {
      return
    }

    try {
      setRemoving(`${userId}-${role}`)

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role)

      if (error) throw error

      alert(`Removed ${role} role from ${memberName}`)
      await fetchStaffMembers()
    } catch (error: any) {
      console.error('Error removing role:', error)
      alert(`Failed to remove role: ${error.message}`)
    } finally {
      setRemoving(null)
    }
  }

  // Helper to check if remove button should be disabled
  const isRemoveDisabled = (staff: StaffMember, role: UserRole): boolean => {
    if (role !== 'Admin') return false

    // Count non-test Admins
    const nonTestAdmins = staffMembers.filter(s =>
      s.roles.includes('Admin') && !s.is_test_account
    )

    // If this is the only non-test Admin, disable the button
    return nonTestAdmins.length === 1 && nonTestAdmins[0].user_id === staff.user_id && !staff.is_test_account
  }

  // Helper to get tooltip for disabled remove button
  const getRemoveTooltip = (staff: StaffMember, role: UserRole): string => {
    if (isRemoveDisabled(staff, role)) {
      return 'Cannot remove - this is the only non-test Admin'
    }
    return `Remove ${role} role`
  }

  return (
    <ProtectedRoute requiredRoles={['Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Role Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Assign and manage staff roles for portal access. Only Admins can access this page.
            </p>
          </div>

          {/* Role Descriptions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-3">Available Roles</h3>
            <div className="space-y-2">
              {(Object.keys(ROLE_DESCRIPTIONS) as UserRole[]).map(role => (
                <div key={role} className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${ROLE_COLORS[role]}`}>
                    {role}
                  </span>
                  <span className="text-sm text-blue-700">{ROLE_DESCRIPTIONS[role]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assign New Role Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Role to Member</h2>
            <p className="text-sm text-gray-600 mb-4">
              Search for any registered member to assign them a staff role. Members must register on the portal first.
            </p>

            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Any Member (not just current staff)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by name, email, or membership ID..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-4 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                  {searchResults.map(member => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedMember?.id === member.id ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </span>
                          {member.is_test_account && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                              TEST
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{member.membership_id}</span>
                      </div>
                      <div className="text-sm text-gray-600">{member.primary_email}</div>
                      {!member.auth_user_id && (
                        <div className="text-xs text-yellow-600 mt-1">
                          ⚠ Not registered yet
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Member & Role Selection */}
              {selectedMember && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Selected Member:</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMember.first_name} {selectedMember.last_name}
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        ({selectedMember.primary_email})
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Role to Assign
                    </label>
                    <div className="flex gap-3">
                      {(['Office Staff', 'Office Manager', 'Admin'] as UserRole[]).map(role => (
                        <label
                          key={role}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer border ${
                            selectedRole === role
                              ? 'border-saffron bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role}
                            checked={selectedRole === role}
                            onChange={() => setSelectedRole(role)}
                            className="text-saffron focus:ring-saffron-ring"
                          />
                          <span className={`text-sm font-medium ${ROLE_COLORS[role]} px-2 py-0.5 rounded`}>
                            {role}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleAssignRole}
                      disabled={assigning || !selectedMember.auth_user_id}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 font-semibold"
                    >
                      {assigning ? 'Assigning...' : `Assign ${selectedRole} Role`}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMember(null)
                        setSearchResults([])
                        setSearchQuery('')
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>

                  {!selectedMember.auth_user_id && (
                    <p className="text-sm text-yellow-600">
                      ⚠ This member must register on the portal first before a role can be assigned.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Current Staff Members */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Current Staff Members</h2>
              <p className="text-sm text-gray-600 mt-1">
                {staffMembers.length} member{staffMembers.length !== 1 ? 's' : ''} with assigned roles
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading staff members...</p>
              </div>
            ) : staffMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p>No staff members with roles assigned yet.</p>
                <p className="text-sm mt-2">Use the form above to assign roles to members.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membership ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staffMembers.map((staff) => (
                      <tr key={staff.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {staff.first_name} {staff.last_name}
                            </div>
                            {staff.is_test_account && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                                TEST
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {staff.primary_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                            {staff.membership_id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {staff.roles.map(role => (
                              <span
                                key={role}
                                className={`px-2 py-1 text-xs font-semibold rounded ${ROLE_COLORS[role]}`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-2">
                            {staff.roles.map(role => {
                              const disabled = removing === `${staff.user_id}-${role}` || isRemoveDisabled(staff, role)
                              return (
                                <button
                                  key={role}
                                  onClick={() => handleRemoveRole(staff.user_id, role, `${staff.first_name} ${staff.last_name}`, staff.is_test_account)}
                                  disabled={disabled}
                                  className={`text-xs ${
                                    isRemoveDisabled(staff, role)
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-red-600 hover:text-red-800 disabled:text-gray-400'
                                  }`}
                                  title={getRemoveTooltip(staff, role)}
                                >
                                  {removing === `${staff.user_id}-${role}` ? 'Removing...' : `Remove ${role}`}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Important Notes</h3>
            <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>Members must register on the portal before a role can be assigned</li>
              <li>A member can have multiple roles if needed</li>
              <li>Removing all roles from a member will revoke their staff access</li>
              <li>Changes take effect immediately after assignment</li>
            </ul>
          </div>

          {/* Admin Protection Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">Admin Role Protection</h3>
            <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
              <li>There must always be at least one non-test Admin account</li>
              <li>The last non-test Admin cannot remove their own Admin role</li>
              <li>Test Admins can be removed freely (for testing purposes)</li>
              <li>If you need to transfer Admin access, assign Admin to another user first</li>
            </ul>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
