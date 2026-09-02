// ============================================================================
// Login Audit Log Server Helper Functions
// Server-side only - uses next/headers
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type { LoginAuditLog } from '@/types/database'

/**
 * Get login audit log for a specific member
 */
export async function getLoginAuditLog(
  options?: {
    memberId?: string
    authUserId?: string
    loginMethod?: string
    success?: boolean
    limit?: number
    offset?: number
    fromDate?: Date
    toDate?: Date
  }
): Promise<{ data: LoginAuditLog[] | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('login_audit_logs')
      .select('*')
      .order('login_at', { ascending: false })

    if (options?.memberId) {
      query = query.eq('member_id', options.memberId)
    }

    if (options?.authUserId) {
      query = query.eq('auth_user_id', options.authUserId)
    }

    if (options?.loginMethod) {
      query = query.eq('login_method', options.loginMethod)
    }

    if (options?.success !== undefined) {
      query = query.eq('success', options.success)
    }

    if (options?.fromDate) {
      query = query.gte('login_at', options.fromDate.toISOString())
    }

    if (options?.toDate) {
      query = query.lte('login_at', options.toDate.toISOString())
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as LoginAuditLog[], error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch login audit log')
    }
  }
}

/**
 * Get login audit log with member details
 */
export async function getLoginAuditLogWithMembers(
  options?: {
    memberId?: string
    loginMethod?: string
    success?: boolean
    limit?: number
    offset?: number
    fromDate?: Date
    toDate?: Date
  }
): Promise<{
  data: (LoginAuditLog & { member?: { first_name: string; last_name: string; membership_id: string; primary_email: string } })[] | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('login_audit_logs')
      .select(`
        *,
        members:member_id (
          first_name,
          last_name,
          membership_id,
          primary_email
        )
      `)
      .order('login_at', { ascending: false })

    if (options?.memberId) {
      query = query.eq('member_id', options.memberId)
    }

    if (options?.loginMethod) {
      query = query.eq('login_method', options.loginMethod)
    }

    if (options?.success !== undefined) {
      query = query.eq('success', options.success)
    }

    if (options?.fromDate) {
      query = query.gte('login_at', options.fromDate.toISOString())
    }

    if (options?.toDate) {
      query = query.lte('login_at', options.toDate.toISOString())
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    // Transform the data to flatten member details
    const transformedData = data?.map((log: any) => ({
      ...log,
      member: log.members ? {
        first_name: log.members.first_name,
        last_name: log.members.last_name,
        membership_id: log.members.membership_id,
        primary_email: log.members.primary_email,
      } : undefined,
    }))

    return { data: transformedData as any, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch login audit log')
    }
  }
}

/**
 * Get login audit log count
 */
export async function getLoginAuditLogCount(
  options?: {
    memberId?: string
    authUserId?: string
    loginMethod?: string
    success?: boolean
    fromDate?: Date
    toDate?: Date
  }
): Promise<{ count: number; error: Error | null }> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('login_audit_logs')
      .select('*', { count: 'exact', head: true })

    if (options?.memberId) {
      query = query.eq('member_id', options.memberId)
    }

    if (options?.authUserId) {
      query = query.eq('auth_user_id', options.authUserId)
    }

    if (options?.loginMethod) {
      query = query.eq('login_method', options.loginMethod)
    }

    if (options?.success !== undefined) {
      query = query.eq('success', options.success)
    }

    if (options?.fromDate) {
      query = query.gte('login_at', options.fromDate.toISOString())
    }

    if (options?.toDate) {
      query = query.lte('login_at', options.toDate.toISOString())
    }

    const { count, error } = await query

    if (error) {
      return { count: 0, error: new Error(error.message) }
    }

    return { count: count || 0, error: null }
  } catch (err) {
    return {
      count: 0,
      error: err instanceof Error ? err : new Error('Failed to fetch login audit log count')
    }
  }
}

// Note: Client-safe utility functions (formatLoginMethod, formatLocation, etc.)
// have been moved to @/lib/login-audit-log/utils for use in client components
