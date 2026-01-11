'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getTestMemberIds } from '@/lib/utils/testDataFiltering'

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  lifetimeMembers: number
  annualMembers: number
  communityMembers: number
  totalPayments: number
  totalRevenue: number
  upcomingEvents: number
  pendingRequests: number
}

export default function AdminDashboard() {
  const { member } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient()

        // Get test member IDs to exclude from stats
        const testMemberIds = await getTestMemberIds()

        // Run all queries in parallel for much faster loading
        // IMPORTANT: All queries exclude test accounts for accurate production stats
        const [
          totalMembersResult,
          lifetimeMembersResult,
          annualMembersResult,
          communityMembersResult,
          totalPaymentsResult,
          revenueDataResult,
          upcomingEventsResult,
          pendingRequestsResult,
        ] = await Promise.all([
          // Members: Exclude test accounts
          supabase.from('members').select('*', { count: 'exact', head: true }).eq('is_test_account', false),
          supabase.from('members').select('*', { count: 'exact', head: true }).eq('current_level', 'Lifetime').eq('is_test_account', false),
          supabase.from('members').select('*', { count: 'exact', head: true }).eq('current_level', 'Annual').eq('is_test_account', false),
          supabase.from('members').select('*', { count: 'exact', head: true }).eq('current_level', 'Community').eq('is_test_account', false),
          // Payments: Exclude test member payments
          testMemberIds.length > 0
            ? supabase.from('payments').select('*', { count: 'exact', head: true }).not('member_id', 'in', `(${testMemberIds.join(',')})`)
            : supabase.from('payments').select('*', { count: 'exact', head: true }),
          // Revenue: Exclude test member payments
          testMemberIds.length > 0
            ? supabase.from('payments').select('amount').not('member_id', 'in', `(${testMemberIds.join(',')})`)
            : supabase.from('payments').select('amount'),
          // Events: Keep all events (including test-created) for now
          supabase.from('events').select('*', { count: 'exact', head: true }).gte('event_date', new Date().toISOString()),
          // Requests: Exclude test member requests
          testMemberIds.length > 0
            ? supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'Sent').not('member_id', 'in', `(${testMemberIds.join(',')})`)
            : supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'Sent'),
        ])

        const totalMembers = totalMembersResult.count || 0
        const totalRevenue = revenueDataResult.data?.reduce((sum, p) => sum + ((p as { amount: number }).amount || 0), 0) || 0

        setStats({
          totalMembers,
          activeMembers: totalMembers, // All members are considered active for now
          lifetimeMembers: lifetimeMembersResult.count || 0,
          annualMembers: annualMembersResult.count || 0,
          communityMembers: communityMembersResult.count || 0,
          totalPayments: totalPaymentsResult.count || 0,
          totalRevenue,
          upcomingEvents: upcomingEventsResult.count || 0,
          pendingRequests: pendingRequestsResult.count || 0,
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back, {member?.member_profile_name || member?.first_name || 'Admin'}!
            </p>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Member Stats */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Membership Overview</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-gray-400"
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
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Members
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              {stats?.totalMembers}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-6 w-6 rounded-full bg-green-500"></div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Active Members
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              {stats?.activeMembers}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-6 w-6 rounded-full bg-[#FF9933]"></div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Lifetime Members
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              {stats?.lifetimeMembers}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-6 w-6 rounded-full bg-blue-500"></div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Annual Members
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              {stats?.annualMembers}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Stats */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-green-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Revenue
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              ${stats?.totalRevenue.toFixed(2)}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Payments
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              {stats?.totalPayments}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-yellow-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Pending Requests
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              {stats?.pendingRequests}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <a
                    href="/admin/scan-qr"
                    className="block p-6 bg-gradient-to-br from-[#FF9933] to-[#E68A2E] text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="text-3xl mb-2">📷</div>
                    <h3 className="text-lg font-bold">Scan QR Code</h3>
                    <p className="mt-2 text-sm opacity-90">
                      Verify members and record check-ins
                    </p>
                  </a>

                  <a
                    href="/admin/members/new"
                    className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="text-3xl mb-2">➕</div>
                    <h3 className="text-lg font-medium text-gray-900">Add New Member</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Register a new member to the portal
                    </p>
                  </a>

                  <a
                    href="/admin/events/new"
                    className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="text-3xl mb-2">📅</div>
                    <h3 className="text-lg font-medium text-gray-900">Create Event</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Schedule a new event for members
                    </p>
                  </a>

                  <a
                    href="/admin/payments"
                    className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="text-3xl mb-2">💳</div>
                    <h3 className="text-lg font-medium text-gray-900">View Payments</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Review and manage payment records
                    </p>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
