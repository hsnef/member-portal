'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MailIcon, FlaskConicalIcon } from 'lucide-react'
import type { Column } from '@/components/ui/DataTable'

interface TestAccount {
  id: string
  membership_id: string
  first_name: string
  last_name: string
  primary_email: string
  current_level: string
  roles: string[]
  auth_user_id?: string
}

export default function TestAccountsPage() {
  const supabase = createClient()
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingLink, setSendingLink] = useState<string | null>(null)

  useEffect(() => {
    fetchTestAccounts()
  }, [])

  const fetchTestAccounts = async () => {
    try {
      setLoading(true)

      // Fetch test accounts from members table
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, membership_id, first_name, last_name, primary_email, current_level, auth_user_id')
        .eq('is_test_account', true)
        .order('membership_id')

      if (membersError) throw membersError

      if (!members || members.length === 0) {
        setTestAccounts([])
        return
      }

      // Get auth user IDs for members who are registered
      const authUserIds = members
        .filter(m => m.auth_user_id)
        .map(m => m.auth_user_id)

      // Fetch roles for all registered test accounts
      let rolesMap: Record<string, string[]> = {}
      if (authUserIds.length > 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', authUserIds)

        if (!rolesError && rolesData) {
          // Group roles by user_id
          rolesData.forEach(({ user_id, role }) => {
            if (!rolesMap[user_id]) {
              rolesMap[user_id] = []
            }
            rolesMap[user_id].push(role)
          })
        }
      }

      // Combine members with their roles
      const accountsWithRoles = members.map(member => ({
        ...member,
        roles: member.auth_user_id && rolesMap[member.auth_user_id]
          ? rolesMap[member.auth_user_id]
          : ['Member']
      }))

      setTestAccounts(accountsWithRoles)
    } catch (error) {
      console.error('Error fetching test accounts:', error)
      alert('Failed to load test accounts')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sends a magic sign-in link.
   *
   * This used to call `resetPasswordForEmail` with a `redirectTo` of
   * `/auth/reset-password` -- a route that does not exist, so the emailed link
   * 404'd and no password could be set. It would not have helped either: the
   * login page has no password field. The portal is magic-link-only, so this
   * button now sends the thing that actually signs someone in.
   */
  const handleSendSignInLink = async (email: string, accountId: string) => {
    if (!confirm(`Email a sign-in link to ${email}?`)) {
      return
    }

    try {
      setSendingLink(accountId)

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      alert(`Sign-in link sent to ${email}`)
    } catch (error: any) {
      console.error('Error sending sign-in link:', error)
      alert(`Failed to send sign-in link: ${error.message}`)
    } finally {
      setSendingLink(null)
    }
  }

  const handleDeleteTestData = async () => {
    if (!confirm(
      'Delete ALL test data?\n\n' +
      'This will delete:\n' +
      '- All payments FOR test accounts\n' +
      '- All payments CREATED BY test accounts\n' +
      '- All bookings by test accounts\n' +
      '- All event registrations by test accounts\n' +
      '- All events CREATED BY test accounts\n' +
      '- All requests by test accounts\n\n' +
      'Member records will be kept but data will be cleaned.\n\n' +
      'This action cannot be undone!'
    )) {
      return
    }

    try {
      setLoading(true)

      const testMemberIds = testAccounts.map(a => a.id)

      // Get auth_user_ids of test accounts for "created_by" cleanup
      const testAuthUserIds = testAccounts
        .filter(a => a.auth_user_id)
        .map(a => a.auth_user_id!)

      // 1. Delete event registrations FIRST (before deleting events)
      // Delete registrations FOR test members
      await supabase
        .from('event_registrations')
        .delete()
        .in('member_id', testMemberIds)

      // 2. Delete events CREATED BY test accounts (this also cascades to their registrations)
      if (testAuthUserIds.length > 0) {
        // First get events created by test users
        const { data: testEvents } = await supabase
          .from('events')
          .select('id')
          .in('created_by', testAuthUserIds)

        if (testEvents && testEvents.length > 0) {
          const testEventIds = testEvents.map(e => e.id)

          // Delete all registrations for these events first
          await supabase
            .from('event_registrations')
            .delete()
            .in('event_id', testEventIds)

          // Now delete the events
          await supabase
            .from('events')
            .delete()
            .in('id', testEventIds)
        }
      }

      // 3. Delete test payments (FOR test accounts)
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .in('member_id', testMemberIds)

      if (paymentsError) throw paymentsError

      // 4. Delete payments CREATED BY test accounts (for any member)
      if (testAuthUserIds.length > 0) {
        await supabase
          .from('payments')
          .delete()
          .in('created_by', testAuthUserIds)
      }

      // 5. Delete test booking items first (due to foreign key)
      const { data: bookings } = await supabase
        .from('service_bookings')
        .select('id')
        .in('member_id', testMemberIds)

      if (bookings && bookings.length > 0) {
        const bookingIds = bookings.map(b => b.id)

        await supabase
          .from('service_booking_items')
          .delete()
          .in('booking_id', bookingIds)

        await supabase
          .from('service_bookings')
          .delete()
          .in('id', bookingIds)
      }

      // 6. Delete bookings CREATED BY test accounts (staff creating bookings for members)
      if (testAuthUserIds.length > 0) {
        const { data: createdBookings } = await supabase
          .from('service_bookings')
          .select('id')
          .in('created_by', testAuthUserIds)

        if (createdBookings && createdBookings.length > 0) {
          const createdBookingIds = createdBookings.map(b => b.id)

          await supabase
            .from('service_booking_items')
            .delete()
            .in('booking_id', createdBookingIds)

          await supabase
            .from('service_bookings')
            .delete()
            .in('id', createdBookingIds)
        }
      }

      // 7. Delete test requests FOR test members
      await supabase
        .from('requests')
        .delete()
        .in('member_id', testMemberIds)

      // 8. Delete requests CREATED BY test accounts
      if (testAuthUserIds.length > 0) {
        await supabase
          .from('requests')
          .delete()
          .in('created_by', testAuthUserIds)
      }

      alert('All test data deleted successfully!\n\nDeleted data FOR and CREATED BY test accounts.')
    } catch (error: any) {
      console.error('Error deleting test data:', error)
      alert(`Failed to delete test data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const columns: Array<Column<TestAccount>> = [
    {
      key: 'name',
      header: 'Account',
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {[a.first_name, a.last_name].filter(Boolean).join(' ') || a.primary_email}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-3">{a.primary_email}</p>
        </div>
      ),
    },
    {
      key: 'membership_id',
      header: 'Membership',
      cell: (a) => <span className="tnum text-ink-2">{a.membership_id ?? '\u2014'}</span>,
    },
    {
      key: 'current_level',
      header: 'Level',
      secondary: true,
      cell: (a) => <span className="text-ink-2">{a.current_level}</span>,
    },
    {
      key: 'roles',
      header: 'Roles',
      cell: (a) => (
        <div className="flex flex-wrap gap-1.5">
          {(a.roles ?? []).map((r) => (
            <Badge key={r} tone={r === 'Admin' ? 'kumkum' : 'neutral'}>
              {r}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (a) => (
        <Button
          size="sm"
          variant="secondary"
          icon={MailIcon}
          loading={sendingLink === a.id}
          onClick={() => handleSendSignInLink(a.primary_email, a.id)}
        >
          Send sign-in link
        </Button>
      ),
    },
  ]

  const mobileCard = (a: TestAccount) => (
    <div className="space-y-2">
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">
          {[a.first_name, a.last_name].filter(Boolean).join(' ') || a.primary_email}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-ink-3">{a.primary_email}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(a.roles ?? []).map((r) => (
          <Badge key={r} tone={r === 'Admin' ? 'kumkum' : 'neutral'}>
            {r}
          </Badge>
        ))}
      </div>
    </div>
  )

  return (
    <ProtectedRoute requiredRoles={['Admin', 'Office Manager']}>
      <AdminListView<TestAccount>
        eyebrow="Settings"
        title="Test accounts"
        description="Seeded logins for QA. Data these accounts create is kept separate from real member data."
        noun="account"
        rows={testAccounts}
        columns={columns}
        rowKey={(a) => a.id}
        mobileCard={mobileCard}
        loading={loading}
        searchPlaceholder="Search by name, email or membership number..."
        searchFields={(a) => [a.first_name, a.last_name, a.primary_email, a.membership_id]}
        emptyIcon={FlaskConicalIcon}
        emptyTitle="No test accounts"
        emptyDescription="Test accounts come from the seed migrations. Run them to populate this list."
      />
    </ProtectedRoute>
  )
}
