import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLoginAuditLogWithMembers } from '@/lib/login-audit-log/helpers'
import { exportLoginAuditLogToCSV } from '@/lib/login-audit-log/utils'

/**
 * GET /api/admin/login-activity/export
 *
 * Export login activity to CSV (Admin and Office Manager only)
 *
 * Query params:
 * - memberId?: string
 * - loginMethod?: string
 * - success?: 'true' | 'false'
 * - fromDate?: ISO string
 * - toDate?: ISO string
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is Admin or Office Manager
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const userRoles = roles?.map(r => r.role) || []
    const hasAccess = userRoles.includes('Admin') || userRoles.includes('Office Manager')

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Office Manager role required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get('memberId') || undefined
    const loginMethod = searchParams.get('loginMethod') || undefined
    const successParam = searchParams.get('success')
    const success = successParam ? successParam === 'true' : undefined
    const fromDateStr = searchParams.get('fromDate')
    const toDateStr = searchParams.get('toDate')

    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined
    const toDate = toDateStr ? new Date(toDateStr) : undefined

    // Fetch ALL login activity logs (no limit for export)
    const { data: logs, error } = await getLoginAuditLogWithMembers({
      memberId,
      loginMethod,
      success,
      fromDate,
      toDate,
      limit: 10000, // Max export limit
    })

    if (error) {
      console.error('Error fetching login activity for export:', error)
      return NextResponse.json(
        { error: 'Failed to fetch login activity', message: error.message },
        { status: 500 }
      )
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { error: 'No login activity found for export' },
        { status: 404 }
      )
    }

    // Convert to CSV
    const csv = exportLoginAuditLogToCSV(logs)

    // Generate filename
    const date = new Date().toISOString().split('T')[0]
    const filename = memberId
      ? `login-activity-member-${memberId}-${date}.csv`
      : `login-activity-all-${date}.csv`

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Login activity export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
