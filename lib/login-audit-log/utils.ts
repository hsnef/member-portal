// ============================================================================
// Login Audit Log Utility Functions (Client-Safe)
// ============================================================================

import type { LoginAuditLog } from '@/types/database'

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
