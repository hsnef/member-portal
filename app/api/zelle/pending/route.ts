import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPendingZelleRequests } from '@/lib/zelle/server'

/**
 * GET /api/zelle/pending
 * Get all pending Zelle payment requests for staff review
 * Requires staff authentication
 */
export async function GET() {
  try {
    // Verify user is authenticated and has staff role
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check for staff role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isStaff = roles?.some(r =>
      ['Office Staff', 'Office Manager', 'Admin'].includes(r.role)
    )

    if (!isStaff) {
      return NextResponse.json(
        { error: 'Staff access required' },
        { status: 403 }
      )
    }

    // Get pending requests
    const requests = await getPendingZelleRequests()

    return NextResponse.json({
      requests,
      count: requests.length,
    })
  } catch (error) {
    console.error('Error fetching pending Zelle requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
