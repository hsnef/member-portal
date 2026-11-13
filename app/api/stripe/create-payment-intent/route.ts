import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { getCurrentMember } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { parseCheckoutItem, priceCheckout } from '@/lib/payments/checkout'
import { createCheckoutIntent } from '@/lib/payments/stripe'

/**
 * Start a card payment. The body names what is being paid for
 * ({ item: { kind: 'booking', bookingId } }, see CheckoutItem); the server
 * decides the amount and checks the item is the signed-in member's.
 * Returns the Stripe client secret and the amount to show.
 */
export async function POST(request: NextRequest) {
  try {
    const member = await getCurrentMember()
    if (!member) return NextResponse.json({ error: 'Please sign in to pay' }, { status: 401 })

    const item = parseCheckoutItem(await request.json().catch(() => null))
    if (!item) return NextResponse.json({ error: 'Nothing to pay for' }, { status: 400 })

    const priced = await priceCheckout(createServiceClient(), member, item)
    if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: priced.status })

    const intent = await createCheckoutIntent(stripe, priced.checkout, member)
    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: priced.checkout.amount,
      description: priced.checkout.description,
    })
  } catch (error) {
    console.error('[create-payment-intent] failed:', error)
    return NextResponse.json({ error: 'Could not start the payment' }, { status: 500 })
  }
}
