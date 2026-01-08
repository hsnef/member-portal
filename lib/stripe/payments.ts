import { stripe, PAYMENT_CONFIG } from './config'
import type { PaymentCategory, PaymentMethod } from '@/types/database'

export interface CreatePaymentIntentParams {
  amount: number // in cents
  currency?: string
  memberId: string
  membershipId: string
  category: PaymentCategory
  description: string
  metadata?: Record<string, string>
}

/**
 * Create a Stripe payment intent for online payments
 */
export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  const {
    amount,
    currency = PAYMENT_CONFIG.currency,
    memberId,
    membershipId,
    category,
    description,
    metadata = {},
  } = params

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata: {
        memberId,
        membershipId,
        category,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw new Error('Failed to create payment intent')
  }
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    throw new Error('Failed to retrieve payment intent')
  }
}

/**
 * Calculate membership renewal fee
 */
export function calculateMembershipFee(level: 'Lifetime' | 'Annual' | 'Community'): number {
  return PAYMENT_CONFIG.membershipFees[level]
}

/**
 * Format amount from cents to dollars
 */
export function formatCurrency(amountInCents: number): string {
  const dollars = amountInCents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars)
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}
