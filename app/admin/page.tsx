'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { AdminDashboardView, type DashboardStats } from '@/components/admin/AdminDashboardView'
import { createClient } from '@/lib/supabase/client'
import { getTestMemberIds } from '@/lib/utils/testDataFiltering'

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
    <AdminDashboardView
      stats={stats}
      loading={loading}
      greetingName={member?.first_name ?? null}
    />
  )
}
