import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLoginAuditLogWithMembers, getLoginAuditLogCount } from '@/lib/login-audit-log/helpers'

/**
 * GET /api/members/[id]/login-activity
 *
 * Get login activity for a specific member (Admin and Office Manager only)
 *
 * Query params:
 * - loginMethod?: string
 * - success?: 'true' | 'false'
 * - fromDate?: ISO string
 * - toDate?: ISO string
 * - limit?: number (default 50)
 * - offset?: number (default 0)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const memberId = params.id

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

    // Verify member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, membership_id, first_name, last_name')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const loginMethod = searchParams.get('loginMethod') || undefined
    const successParam = searchParams.get('success')
    const success = successParam ? successParam === 'true' : undefined
    const fromDateStr = searchParams.get('fromDate')
    const toDateStr = searchParams.get('toDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined
    const toDate = toDateStr ? new Date(toDateStr) : undefined

    // Fetch login activity logs for this member
    const { data: logs, error } = await getLoginAuditLogWithMembers({
      memberId,
      loginMethod,
      success,
      fromDate,
      toDate,
      limit,
      offset,
    })

    if (error) {
      console.error('Error fetching login activity:', error)
      return NextResponse.json(
        { error: 'Failed to fetch login activity', message: error.message },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await getLoginAuditLogCount({
      memberId,
      loginMethod,
      success,
      fromDate,
      toDate,
    })

    if (countError) {
      console.warn('Error fetching count:', countError)
    }

    return NextResponse.json({
      data: logs,
      member: {
        id: member.id,
        membership_id: member.membership_id,
        name: `${member.first_name} ${member.last_name}`,
      },
      count: count || 0,
      limit,
      offset,
    })

  } catch (error) {
    console.error('Login activity API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
