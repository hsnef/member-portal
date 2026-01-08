// ============================================================================
// Member Audit Log API Route
// ============================================================================
// Get audit log for a specific member
// Access: Office Staff, Office Manager, Admin (all entries)
//         Members (own entries only, limited fields)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMemberAuditLog } from '@/lib/audit-log/helpers'
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

    // Check if user is staff
    const isStaff = await hasAnyRole(['Office Staff', 'Office Manager', 'Admin'])
    
    // If not staff, verify they're viewing their own member record
    if (!isStaff) {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('auth_user_id')
        .eq('id', memberId)
        .single()
      
      if (memberError || !member) {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        )
      }
      
      if (member.auth_user_id !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden - You can only view your own audit log' },
          { status: 403 }
        )
      }
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const actionType = searchParams.get('actionType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined
    const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined

    // Fetch audit log
    const { data, error } = await getMemberAuditLog(memberId, {
      actionType: actionType as any,
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
    console.error('Error in audit-log route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
