import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { staffConfirmPayment } from '@/lib/zelle/server'

/**
 * POST /api/zelle/staff-confirm
 * Staff confirms Zelle payment was received
 * Requires staff authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, notes } = body

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference code is required' },
        { status: 400 }
      )
    }

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

    // Process the confirmation
    const result = await staffConfirmPayment(reference, user.id, notes)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully. Receipt will be sent to member.',
    })
  } catch (error) {
    console.error('Error confirming Zelle payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
