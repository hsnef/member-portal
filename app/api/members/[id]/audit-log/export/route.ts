// ============================================================================
// Export Member Audit Log to CSV
// ============================================================================
// Export audit log for a specific member to CSV format
// Access: Office Manager, Admin only

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMemberAuditLog, exportAuditLogToCSV } from '@/lib/audit-log/helpers'
import { hasAnyRole } from '@/lib/auth/helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id
    
    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is Manager or Admin
    const isManagerOrAdmin = await hasAnyRole(['Office Manager', 'Admin'])
    if (!isManagerOrAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only Office Manager and Admin can export audit logs' },
        { status: 403 }
      )
    }

    // Verify member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('membership_id, first_name, last_name, business_name, member_class')
      .eq('id', memberId)
      .single()
    
    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const actionType = searchParams.get('actionType')
    const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined
    const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined

    // Fetch all audit log entries (no limit for export)
    const { data, error } = await getMemberAuditLog(memberId, {
      actionType: actionType as any,
      fromDate,
      toDate,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No audit log entries found' },
        { status: 404 }
      )
    }

    // Generate CSV
    const csvContent = exportAuditLogToCSV(data)
    
    // Get member name for filename
    const memberName = member.member_class === 'Personal'
      ? `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Member'
      : member.business_name || 'Member'
    const filename = `audit-log-${member.membership_id}-${memberName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error in audit-log export route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
