import { NextRequest, NextResponse } from 'next/server'
import { memberConfirmPayment, getZelleRequestByReference } from '@/lib/zelle/server'

/**
 * POST /api/zelle/confirm-sent
 * Member confirms they have sent the Zelle payment
 * This is a public endpoint (no auth required) to support walk-in payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, zelleReference } = body

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference code is required' },
        { status: 400 }
      )
    }

    // Verify the request exists
    const zelleRequest = await getZelleRequestByReference(reference)

    if (!zelleRequest) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      )
    }

    // Process the confirmation
    const result = await memberConfirmPayment(reference, zelleReference)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      autoConfirmed: result.autoConfirmed,
      message: result.autoConfirmed
        ? 'Payment confirmed! Your receipt will be emailed shortly.'
        : 'Payment marked as sent. Staff will confirm receipt shortly.',
    })
  } catch (error) {
    console.error('Error confirming Zelle payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
