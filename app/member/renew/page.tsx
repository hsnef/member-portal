'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import { getMembershipPricing, type MembershipPricing } from '@/lib/utils/portalSettings'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function RenewMembershipForm({
  pricing,
  selectedLevel,
  onLevelChange
}: {
  pricing: MembershipPricing
  selectedLevel: 'annual' | 'lifetime'
  onLevelChange: (level: 'annual' | 'lifetime') => void
}) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { member } = useAuth()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !member) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/member/payment-success?type=membership&level=${selectedLevel}`,
        },
      })

      if (error) {
        setMessage(error.message || 'An error occurred')
      }
    } catch (err) {
      setMessage('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const amount = pricing[selectedLevel].price

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Membership Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['annual', 'lifetime'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onLevelChange(level)}
              className={`p-6 border-2 rounded-lg transition-all ${
                selectedLevel === level
                  ? 'border-saffron bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="text-xl font-bold text-gray-900 mb-2 capitalize">{level} Membership</h4>
              <p className="text-3xl font-bold text-saffron mb-2">
                {pricing[level].displayPrice}
              </p>
              <p className="text-sm text-gray-600">
                {pricing[level].description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {amount > 0 && (
        <>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            <PaymentElement />
          </div>

          {message && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{message}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push('/member')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading}
              className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </button>
          </div>
        </>
      )}
    </form>
  )
}

function RenewMembershipContent() {
  const router = useRouter()
  const { member } = useAuth()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pricing, setPricing] = useState<MembershipPricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<'annual' | 'lifetime'>('annual')
  const [updatingPayment, setUpdatingPayment] = useState(false)

  // Create or update payment intent based on selected level
  const createPaymentIntent = useCallback(async (level: 'annual' | 'lifetime', membershipPricing: MembershipPricing) => {
    if (!member) return null

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(membershipPricing[level].price * 100), // Convert to cents
          memberId: member.id,
          category: 'Membership',
          description: `${level.charAt(0).toUpperCase() + level.slice(1)} membership renewal`,
          metadata: {
            membershipLevel: level,
          },
        }),
      })

      const data = await response.json()
      return data.clientSecret || null
    } catch (error) {
      console.error('Error creating payment intent:', error)
      return null
    }
  }, [member])

  // Handle level change - create new payment intent
  const handleLevelChange = async (level: 'annual' | 'lifetime') => {
    if (level === selectedLevel || !pricing) return

    setUpdatingPayment(true)
    setSelectedLevel(level)

    // Create new payment intent with correct amount
    const newClientSecret = await createPaymentIntent(level, pricing)
    if (newClientSecret) {
      setClientSecret(newClientSecret)
    }

    setUpdatingPayment(false)
  }

  useEffect(() => {
    if (!member) return

    // Fetch pricing and create initial payment intent
    const initializePayment = async () => {
      try {
        // Fetch membership pricing from database
        const membershipPricing = await getMembershipPricing()
        setPricing(membershipPricing)

        // Create payment intent with default annual price
        const secret = await createPaymentIntent('annual', membershipPricing)
        if (secret) {
          setClientSecret(secret)
        }
      } catch (error) {
        console.error('Error initializing payment:', error)
      } finally {
        setLoading(false)
      }
    }

    initializePayment()
  }, [member, createPaymentIntent])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading payment form...</p>
        </div>
      </div>
    )
  }

  if (!clientSecret || !pricing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Initialize Payment</h2>
          <p className="text-gray-600 mb-6">
            We couldn't set up the payment form. Please try again or contact support.
          </p>
          <button
            onClick={() => router.push('/member')}
            className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#c75b12',
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/member')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Renew Membership</h1>
          <p className="mt-2 text-gray-600">
            Renew your membership and continue enjoying temple benefits
          </p>
        </div>

        {/* Current Membership Info */}
        {member && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Current Membership</p>
                <p className="text-lg font-bold text-blue-900">{member.current_level}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Membership ID</p>
                <p className="font-mono font-bold text-blue-900">{member.membership_id}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <div className="bg-white shadow rounded-lg p-6 relative">
          {updatingPayment && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-saffron border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-600">Updating payment...</p>
              </div>
            </div>
          )}
          <Elements stripe={stripePromise} options={options} key={clientSecret}>
            <RenewMembershipForm
              pricing={pricing}
              selectedLevel={selectedLevel}
              onLevelChange={handleLevelChange}
            />
          </Elements>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Secure payment powered by Stripe</p>
          <p className="mt-1">Your payment information is encrypted and secure</p>
        </div>
      </div>
    </div>
  )
}

export default function RenewMembershipPage() {
  return (
    <ProtectedRoute>
      <RenewMembershipContent />
    </ProtectedRoute>
  )
}
