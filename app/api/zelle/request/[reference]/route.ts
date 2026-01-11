import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getZelleRequestByReference, getZelleSettingsServer } from '@/lib/zelle/server'
import { generateZelleQRCode, getZellePaymentURL } from '@/lib/zelle'

/**
 * GET /api/zelle/request/[reference]
 * Get a Zelle payment request by reference code
 * This is a public endpoint for the payment page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference code is required' },
        { status: 400 }
      )
    }

    // Get the request
    const zelleRequest = await getZelleRequestByReference(reference)

    if (!zelleRequest) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date(zelleRequest.expires_at) < new Date() && zelleRequest.status === 'pending') {
      return NextResponse.json(
        { error: 'This payment request has expired', expired: true },
        { status: 410 }
      )
    }

    // Get Zelle settings
    const settings = await getZelleSettingsServer()

    // Get member info if linked
    let memberInfo = null
    if (zelleRequest.member_id) {
      const supabase = await createClient()
      const { data: member } = await supabase
        .from('members')
        .select('membership_id, first_name, last_name, business_name, member_class, primary_email')
        .eq('id', zelleRequest.member_id)
        .single()

      if (member) {
        memberInfo = {
          membershipId: member.membership_id,
          name: member.member_class === 'Personal'
            ? `${member.first_name} ${member.last_name}`
            : member.business_name,
          email: member.primary_email,
        }
      }
    }

    // Generate QR code
    const qrCode = await generateZelleQRCode(zelleRequest.reference_code)
    const paymentUrl = getZellePaymentURL(zelleRequest.reference_code)

    return NextResponse.json({
      request: {
        id: zelleRequest.id,
        reference_code: zelleRequest.reference_code,
        amount: zelleRequest.amount,
        purpose: zelleRequest.purpose,
        description: zelleRequest.description,
        status: zelleRequest.status,
        expires_at: zelleRequest.expires_at,
        created_at: zelleRequest.created_at,
        member_confirmed_at: zelleRequest.member_confirmed_at,
      },
      member: memberInfo,
      zelle: {
        email: settings.zelle_email,
        phone: settings.zelle_phone,
        instructions: settings.instructions,
      },
      qrCode,
      paymentUrl,
    })
  } catch (error) {
    console.error('Error fetching Zelle request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
