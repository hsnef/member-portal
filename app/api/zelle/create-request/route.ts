import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createZelleRequest } from '@/lib/zelle/server'
import { generateZelleQRCode, getZellePaymentURL } from '@/lib/zelle'
import type { PaymentPurpose } from '@/types/database'

/**
 * POST /api/zelle/create-request
 * Create a new Zelle payment request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      memberId,
      amount,
      purpose,
      description,
      requestId,
      eventRegistrationId,
      serviceBookingId,
    } = body

    // Validate required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!purpose) {
      return NextResponse.json(
        { error: 'Purpose is required' },
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

    // If memberId provided, verify access
    if (memberId) {
      const { data: member } = await supabase
        .from('members')
        .select('id, auth_user_id')
        .eq('id', memberId)
        .single()

      // Check if user is the member or has staff role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      const isStaff = roles?.some(r =>
        ['Office Staff', 'Office Manager', 'Admin'].includes(r.role)
      )

      if (!isStaff && member?.auth_user_id !== user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Create the Zelle request
    const result = await createZelleRequest({
      memberId,
      amount,
      purpose: purpose as PaymentPurpose,
      description,
      requestId,
      eventRegistrationId,
      serviceBookingId,
      createdBy: user.id,
    })

    if (!result.success || !result.request) {
      return NextResponse.json(
        { error: result.error || 'Failed to create request' },
        { status: 400 }
      )
    }

    // Generate QR code
    const qrCode = await generateZelleQRCode(result.request.reference_code)
    const paymentUrl = getZellePaymentURL(result.request.reference_code)

    return NextResponse.json({
      success: true,
      request: result.request,
      qrCode,
      paymentUrl,
    })
  } catch (error) {
    console.error('Error creating Zelle request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
