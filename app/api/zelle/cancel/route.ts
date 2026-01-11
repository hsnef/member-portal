import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelZelleRequest, getZelleRequestByReference } from '@/lib/zelle/server'

/**
 * POST /api/zelle/cancel
 * Cancel a Zelle payment request
 * Can be called by the member who owns it or by staff
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference code is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the request to check ownership
    const zelleRequest = await getZelleRequestByReference(reference)

    if (!zelleRequest) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      )
    }

    // Check if user is the owner or has staff role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isStaff = roles?.some(r =>
      ['Office Staff', 'Office Manager', 'Admin'].includes(r.role)
    )

    if (!isStaff && zelleRequest.member_id) {
      // Check if user owns the member record
      const { data: member } = await supabase
        .from('members')
        .select('auth_user_id')
        .eq('id', zelleRequest.member_id)
        .single()

      if (member?.auth_user_id !== user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Cancel the request
    const result = await cancelZelleRequest(reference)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment request cancelled',
    })
  } catch (error) {
    console.error('Error cancelling Zelle request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
