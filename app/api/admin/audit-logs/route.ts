// ============================================================================
// Global Audit Log API Route
// ============================================================================
// Get global audit log across all members
// Access: Office Manager, Admin only

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGlobalAuditLog } from '@/lib/audit-log/helpers'
import { hasAnyRole } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
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
        { error: 'Forbidden - Only Office Manager and Admin can view global audit logs' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get('memberId')
    const actionType = searchParams.get('actionType')
    const creationSource = searchParams.get('creationSource')
    const changedBy = searchParams.get('changedBy')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined
    const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined

    // Fetch audit log
    const { data, error } = await getGlobalAuditLog({
      memberId: memberId || undefined,
      actionType: actionType as any,
      creationSource: creationSource as any,
      changedBy: changedBy || undefined,
      limit,
      offset,
      fromDate,
      toDate,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in global audit-logs route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
