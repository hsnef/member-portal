// ============================================================================
// Login Audit Log Helper Functions
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

/**
 * Format login method for display
 */
export function formatLoginMethod(method: string): string {
  const methodMap: Record<string, string> = {
    google: 'Google OAuth',
    magic_link: 'Magic Link (Email)',
    email: 'Email/Password',
    registration: 'Registration',
    session_restored: 'Session Restored',
  }

  return methodMap[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Format location for display
 */
export function formatLocation(country: string | null, city: string | null): string {
  if (city && country) {
    return `${city}, ${country}`
  }
  if (country) {
    return country
  }
  if (city) {
    return city
  }
  return 'Unknown'
}

/**
 * Format user agent for display (extract browser and OS)
 */
export function formatUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown'

  // Simple extraction - could be enhanced with a proper UA parser library
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  // Detect browser
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'

  return `${browser} on ${os}`
}

/**
 * Export login audit log to CSV format
 */
export function exportLoginAuditLogToCSV(
  logs: (LoginAuditLog & { member?: { first_name: string; last_name: string; membership_id: string; primary_email: string } })[]
): string {
  const headers = [
    'Login Date/Time',
    'User Name',
    'Member ID',
    'Email',
    'Login Method',
    'IP Address',
    'Location (City, Country)',
    'Device/Browser',
    'Success',
    'Failure Reason',
  ]

  const rows = logs.map(log => {
    const date = new Date(log.login_at).toLocaleString()
    const memberName = log.member
      ? `${log.member.first_name} ${log.member.last_name}`
      : 'N/A'
    const membershipId = log.member?.membership_id || 'N/A'
    const email = log.member?.primary_email || 'N/A'
    const location = formatLocation(log.geo_country, log.geo_city)
    const device = formatUserAgent(log.user_agent)
    const success = log.success ? 'Yes' : 'No'

    return [
      date,
      memberName,
      membershipId,
      email,
      formatLoginMethod(log.login_method),
      log.ip_address || 'N/A',
      location,
      device,
      success,
      log.failure_reason || '',
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return csvContent
}
