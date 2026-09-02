'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Select } from '@/components/ui/Field'
import { IconTile } from '@/components/ui/IconTile'
import { Skeleton } from '@/components/ui/Skeleton'
import { MemberPicker } from '@/components/admin/MemberPicker'
import { ShieldCheckIcon, UserIcon, UserPlusIcon, XIcon } from 'lucide-react'

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

  const roleTone: Record<string, 'kumkum' | 'saffron' | 'tulsi' | 'neutral'> = {
    Admin: 'kumkum',
    'Office Manager': 'saffron',
    'Office Staff': 'tulsi',
    Member: 'neutral',
  }

  /* This file's local UserRole is already staff-only -- `Member` is held by
     everyone and is not something the office grants. */
  const STAFF_ONLY: UserRole[] = ['Office Staff', 'Office Manager', 'Admin']

  return (
    <ProtectedRoute requiredRoles={['Admin']}>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Settings"
          title="Staff roles"
          description="Who can use the office console, and what each of them can do."
        />

        <Card tone="sunk" spine="kumkum" className="pl-7">
          <CardHeader title="What each role can do" />
          <dl className="space-y-3">
            {STAFF_ONLY.map((role) => (
              <div key={role} className="flex items-start gap-3">
                <Badge tone={roleTone[role] ?? 'neutral'}>{role}</Badge>
                <dd className="text-[14px] leading-relaxed text-ink-2">
                  {ROLE_DESCRIPTIONS[role]}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[13.5px] text-ink-3">
            Roles are additive and every staff member is also a Member, so they keep their own
            membership and portal.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Give someone a role"
            description="Find the member first, then choose what they should be able to do."
          />
          <div className="space-y-5">
            <MemberPicker
              title="Which member?"
              description="They need a membership record before they can be given a staff role."
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSearch={handleSearch}
              searching={searching}
              results={searchResults}
              selected={selectedMember}
              onSelect={(m) =>
                setSelectedMember(searchResults.find((r) => r.id === m.id) ?? null)
              }
              onClear={() => setSelectedMember(null)}
            />

            {selectedMember && (
              <>
                {!selectedMember.auth_user_id && (
                  <Alert tone="warning" title="They have not signed in yet">
                    A role can only be given to someone with portal access. Send them an
                    invitation from their member record first.
                  </Alert>
                )}

                <Field label="Role">
                  {({ id }) => (
                    <Select
                      id={id}
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    >
                      {STAFF_ONLY.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

                <Button
                  icon={UserPlusIcon}
                  loading={assigning}
                  disabled={!selectedMember.auth_user_id}
                  onClick={handleAssignRole}
                >
                  Give the {selectedRole} role
                </Button>
              </>
            )}
          </div>
        </Card>

        <div>
          <h2 className="font-serif text-[24px] leading-tight text-ink">Current staff</h2>

          {loading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : staffMembers.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={ShieldCheckIcon}
                title="No staff yet"
                description="Give a member the Office Staff, Office Manager or Admin role and they will appear here."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {staffMembers.map((staff) => (
                <Card as="li" key={staff.user_id} className="flex flex-wrap items-start gap-4">
                  <IconTile icon={UserIcon} tone="kumkum" size="md" shape="arch" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {[staff.first_name, staff.last_name].filter(Boolean).join(' ')}
                      {staff.is_test_account && (
                        <span className="ml-2">
                          <Badge tone="neutral">Test account</Badge>
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[13.5px] text-ink-3">{staff.primary_email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {staff.roles.map((role) => (
                          <span key={role} className="inline-flex items-center gap-1">
                            <Badge tone={roleTone[role] ?? 'neutral'}>{role}</Badge>
                            <button
                              type="button"
                              aria-label={`Remove the ${role} role from ${staff.first_name}`}
                              disabled={removing === `${staff.user_id}-${role}`}
                              onClick={() =>
                                handleRemoveRole(
                                  staff.user_id,
                                  role,
                                  `${staff.first_name} ${staff.last_name}`,
                                  staff.is_test_account
                                )
                              }
                              className="rounded-lg p-1 text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                            >
                              <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </span>
                      ))}
                    </div>
                  </div>
                  {staff.user_id === currentUserId && (
                    <p className="text-[13px] text-ink-3">This is you</p>
                  )}
                </Card>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
