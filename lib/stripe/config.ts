import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Stripe publishable key for client-side
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

// Payment configuration
export const PAYMENT_CONFIG = {
  currency: 'usd',
  // Membership fees (in cents)
  membershipFees: {
    Lifetime: 100100, // $1001.00
    Annual: 25100,    // $251.00
    Community: 0,     // Free
  },
  // Minimum donation amount (in cents)
  minDonationAmount: 100, // $1.00
}
