import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/stripe/payments'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, memberId, category, description, metadata } = body

    // Validate required fields
    if (!amount || !memberId || !category || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Get member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('membership_id')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Create payment intent
    const result = await createPaymentIntent({
      amount,
      memberId,
      membershipId: member.membership_id,
      category,
      description,
      metadata,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in create-payment-intent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
