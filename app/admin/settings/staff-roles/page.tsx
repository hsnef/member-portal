'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import { wouldRemoveLastAdmin } from '@/lib/admin/staffRules'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import { IconTile } from '@/components/ui/IconTile'
import { Skeleton } from '@/components/ui/Skeleton'
import { ShieldCheckIcon, UserIcon, UserPlusIcon, XIcon } from 'lucide-react'

type UserRole = 'Admin' | 'Office Manager' | 'Office Staff'

/** One sign-in account holding staff roles. Staff need not be members. */
interface StaffAccount {
  user_id: string
  email: string
  name: string
  membership_id: string | null
  roles: UserRole[]
  is_test_account: boolean
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  'Admin': 'Everything, including portal settings and giving or removing staff roles. Every Admin has the same full access.',
  'Office Manager': 'Can manage members, approve bookings, record payments, and access most admin features',
  'Office Staff': 'Can view members, process day-to-day transactions, and handle basic admin tasks',
}

export default function StaffRolesPage() {
  const [staffMembers, setStaffMembers] = useState<StaffAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('Office Staff')
  const [assigning, setAssigning] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const { user } = useAuth()
  const currentUserId = user?.id ?? null

  useEffect(() => {
    fetchStaffMembers()
  }, [])

  // Staff are read through /api/admin/staff, which lists sign-in accounts
  // holding a role, with or without a membership. Reading `members` here
  // used to hide every staff account that is not also a member.
  const fetchStaffMembers = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const res = await fetch('/api/admin/staff')
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not load staff')
      setStaffMembers(body.staff ?? [])
    } catch (error) {
      console.error('Error fetching staff:', error)
      setLoadError(error instanceof Error ? error.message : 'Could not load staff')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async () => {
    setNotice(null)
    try {
      setAssigning(true)
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: selectedRole }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNotice({ tone: 'danger', text: body.error || 'Could not give the role.' })
        return
      }
      setNotice({
        tone: 'success',
        text: `${body.email} now has the ${body.role} role. They sign in at the portal with that address; we email them a link.`,
      })
      setEmail('')
      await fetchStaffMembers()
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveRole = async (staff: StaffAccount, role: UserRole) => {
    const who = staff.name || staff.email
    if (staff.user_id === currentUserId && role === 'Admin') {
      if (!confirm('You are about to remove your own Admin role. You will lose access to this page. Continue?')) return
    } else if (!confirm(`Remove the ${role} role from ${who}? Their access changes immediately.`)) {
      return
    }
    setNotice(null)
    try {
      setRemoving(`${staff.user_id}-${role}`)
      const res = await fetch('/api/admin/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: staff.user_id, role }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNotice({ tone: 'danger', text: body.error || 'Could not remove the role.' })
        return
      }
      setNotice({ tone: 'success', text: `Removed the ${role} role from ${who}.` })
      await fetchStaffMembers()
    } finally {
      setRemoving(null)
    }
  }

  // The last Admin who is not a test account cannot lose the role: only an
  // Admin can grant roles. The server enforces the same rule.
  const isRemoveDisabled = (staff: StaffAccount, role: UserRole): boolean =>
    wouldRemoveLastAdmin(staffMembers, staff.user_id, role)

  // Helper to get tooltip for disabled remove button
  const getRemoveTooltip = (staff: StaffAccount, role: UserRole): string => {
    if (isRemoveDisabled(staff, role)) {
      return 'The only Admin cannot lose the role. Give someone else the Admin role first.'
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
            Roles are additive. Staff need not be members; a staff member who is also a member keeps
            their own membership and portal.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Give someone a role"
            description="Enter the person's email address and choose what they should be able to do."
          />
          <div className="space-y-5">
            {notice && (
              <Alert tone={notice.tone} title={notice.tone === 'success' ? 'Done' : 'Not changed'}>
                {notice.text}
              </Alert>
            )}

            <Field
              label="Their email address"
              hint="The address they will sign in with. They do not need a membership; if they have one, use its main email address."
            >
              {({ id }) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.org"
                />
              )}
            </Field>

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
              disabled={!email.trim()}
              onClick={handleAssignRole}
            >
              Give the {selectedRole} role
            </Button>
          </div>
        </Card>

        <div>
          <h2 className="font-serif text-[24px] leading-tight text-ink">Current staff</h2>

          {loading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : loadError ? (
            <div className="mt-4">
              <Alert tone="danger" title="Could not load staff">
                {loadError}.{' '}
                <button type="button" className="underline" onClick={fetchStaffMembers}>
                  Try again
                </button>
              </Alert>
            </div>
          ) : staffMembers.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={ShieldCheckIcon}
                title="No staff yet"
                description="Give someone the Office Staff, Office Manager or Admin role and they will appear here."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {staffMembers.map((staff) => (
                <Card as="li" key={staff.user_id} className="flex flex-wrap items-start gap-4">
                  <IconTile icon={UserIcon} tone="kumkum" size="md" shape="arch" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {staff.name || staff.email}
                      {staff.is_test_account && (
                        <span className="ml-2">
                          <Badge tone="neutral">Test account</Badge>
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[13.5px] text-ink-3">
                      {staff.name ? staff.email : 'No membership'}
                      {staff.membership_id ? ` · ${staff.membership_id}` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {staff.roles.map((role) => (
                          <span key={role} className="inline-flex items-center gap-1">
                            <Badge tone={roleTone[role] ?? 'neutral'}>{role}</Badge>
                            <button
                              type="button"
                              aria-label={`Remove the ${role} role from ${staff.name || staff.email}`}
                              title={getRemoveTooltip(staff, role)}
                              disabled={removing === `${staff.user_id}-${role}` || isRemoveDisabled(staff, role)}
                              onClick={() => handleRemoveRole(staff, role)}
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
