/**
 * Test Data Filtering Utilities
 *
 * Helps separate test data from production data throughout the application.
 * Test accounts are marked with is_test_account = true
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Check if a member is a test account
 */
export async function isTestMember(memberId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('members')
    .select('is_test_account')
    .eq('id', memberId)
    .single()

  if (error || !data) return false
  return data.is_test_account === true
}

/**
 * Get all test member IDs (for filtering queries)
 */
export async function getTestMemberIds(): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('is_test_account', true)

  if (error || !data) return []
  return data.map(m => m.id)
}

/**
 * Get all test member auth_user_ids (for filtering events/items created by test users)
 */
export async function getTestAuthUserIds(): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('members')
    .select('auth_user_id')
    .eq('is_test_account', true)
    .not('auth_user_id', 'is', null)

  if (error || !data) return []
  return data.map(m => m.auth_user_id).filter(Boolean) as string[]
}

/**
 * Check if auth user is a test account
 * Returns the member's test status and member_id
 */
export async function getCurrentUserTestStatus(): Promise<{
  isTest: boolean
  memberId: string | null
}> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isTest: false, memberId: null }

  const { data, error } = await supabase
    .from('members')
    .select('id, is_test_account')
    .eq('auth_user_id', user.id)
    .single()

  if (error || !data) return { isTest: false, memberId: null }

  return {
    isTest: data.is_test_account === true,
    memberId: data.id
  }
}

/**
 * Filter query builder - adds test account exclusion to queries
 * Use this to filter members table queries
 */
export function excludeTestMembers<T>(query: any): any {
  return query.eq('is_test_account', false)
}

/**
 * Filter for payments - exclude payments from test members
 * Returns a list of test member IDs to use with .not('member_id', 'in', (...))
 */
export async function getTestMemberIdsForFiltering(): Promise<string[]> {
  return getTestMemberIds()
}

/**
 * Check if current user should see test data
 * Returns true if:
 * - User is a test account (see their own test data)
 * - Admin/Manager with "show test data" toggle enabled (from context)
 */
export async function shouldShowTestData(): Promise<boolean> {
  const { isTest } = await getCurrentUserTestStatus()

  // Test users always see test data (isolated)
  if (isTest) return true

  // Staff can toggle test data visibility via TestDataContext
  // This is checked separately in components using useTestData hook
  return false
}

/**
 * Check if current user is in test isolation mode
 * Test users should ONLY see test data, not production data
 */
export async function isTestIsolationMode(): Promise<boolean> {
  const { isTest } = await getCurrentUserTestStatus()
  return isTest
}

/**
 * Format a badge for test items in UI
 */
export function getTestBadge() {
  return {
    text: 'TEST',
    emoji: '🧪',
    className: 'px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800'
  }
}
