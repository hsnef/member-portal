import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isStaff } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { parseCheckoutItem } from '@/lib/payments/checkout'
import { parseOfficePayment, recordOfficePayment } from '@/lib/payments/office'

/**
 * Office staff record a payment taken in person (cash, cheque, Zelle, the
 * temple's card machine). Body: { submissionId, memberId, method, item,
 * checkNumber?, reference?, notes? } - `item` as for an online checkout. The
 * server prices it and records it through the settlement step, which marks
 * the item paid and emails the receipt.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
    if (!(await isStaff())) return NextResponse.json({ error: 'Only office staff can record payments' }, { status: 403 })

    const body = await request.json().catch(() => null)
    const input = parseOfficePayment(body, parseCheckoutItem(body))
    if (typeof input === 'string') return NextResponse.json({ error: input }, { status: 400 })

    const outcome = await recordOfficePayment(createServiceClient(), user.id, input)
    if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status })
    return NextResponse.json({
      paymentId: outcome.result.paymentId,
      receiptNumber: outcome.result.receiptNumber,
      receiptEmailed: outcome.result.receiptEmailed,
      alreadyRecorded: outcome.result.alreadySettled,
      amount: outcome.amount,
      description: outcome.description,
    })
  } catch (error) {
    console.error('[admin/payments] failed:', error)
    return NextResponse.json({ error: 'Could not record the payment' }, { status: 500 })
  }
}
