'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

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
  const [resettingPassword, setResettingPassword] = useState<string | null>(null)

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

  const handleResetPassword = async (email: string, accountId: string) => {
    if (!confirm(`Reset password for ${email}?\n\nA password reset email will be sent.`)) {
      return
    }

    try {
      setResettingPassword(accountId)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      alert(`Password reset email sent to ${email}`)
    } catch (error: any) {
      console.error('Error resetting password:', error)
      alert(`Failed to reset password: ${error.message}`)
    } finally {
      setResettingPassword(null)
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

  return (
    <ProtectedRoute requiredRoles={['Admin', 'Office Manager']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Test Accounts</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage test accounts for testing functionality without affecting real data
              </p>
            </div>
            <button
              onClick={handleDeleteTestData}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 font-semibold"
            >
              Clean Test Data
            </button>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">About Test Accounts</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Test accounts are automatically filtered from reports and metrics</li>
                    <li>Use membership numbers in 9999xxxx range</li>
                    <li>Test accounts can perform all normal actions (payments, bookings, etc.)</li>
                    <li>Use "Clean Test Data" to remove all transactions without deleting accounts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Test Accounts List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading test accounts...</p>
              </div>
            ) : testAccounts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No test accounts found</p>
                <p className="text-sm text-gray-500 mt-2">Run the test accounts migration to create them</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membership #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-mono bg-purple-100 text-purple-800 rounded">
                            {account.membership_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {account.first_name} {account.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.primary_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {account.current_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.roles.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {account.auth_user_id ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              ✓ Registered
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Not Registered
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleResetPassword(account.primary_email, account.id)}
                            disabled={resettingPassword === account.id}
                            className="text-saffron hover:text-saffron-hover disabled:text-gray-400"
                          >
                            {resettingPassword === account.id ? 'Sending...' : 'Reset Password'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use Test Accounts</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Register Test Users</h3>
                <p>
                  If accounts show "Not Registered", register them using their email addresses above:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>dev-mp+testadmin@hsnef.org - Admin (full admin access)</li>
                  <li>dev-mp+testmanager@hsnef.org - Office Manager (staff management)</li>
                  <li>dev-mp+teststaff@hsnef.org - Office Staff (staff functions)</li>
                  <li>dev-mp+testlifetime@hsnef.org - Lifetime Member</li>
                  <li>dev-mp+testannual@hsnef.org - Annual Member</li>
                  <li>dev-mp+testcommunity@hsnef.org - Community Member (non-paid)</li>
                </ul>
                <p className="mt-2">Use the "Reset Password" button to send registration/reset emails.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Test Functionality</h3>
                <p>Use these accounts to test:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Payments, donations, and receipts</li>
                  <li>Service bookings with different pricing tiers</li>
                  <li>Event registrations</li>
                  <li>Staff workflows and approvals</li>
                  <li>QR code scanning</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Clean Test Data</h3>
                <p>
                  When you're done testing or want a fresh start, click "Clean Test Data" to remove:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>All data FOR test accounts (payments, bookings, registrations, requests)</li>
                  <li>All data CREATED BY test accounts (events, payments recorded by test staff, etc.)</li>
                </ul>
                <p className="mt-2">
                  The member records will remain for future testing. This ensures all test data is cleanly removed.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4. Filtering</h3>
                <p>
                  Test accounts are automatically excluded from:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Dashboard metrics and statistics</li>
                  <li>Financial reports</li>
                  <li>Member count displays</li>
                  <li>Analytics and insights</li>
                </ul>
                <p className="mt-2 text-gray-600 italic">
                  Note: Test accounts ARE visible in admin member lists for management purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
