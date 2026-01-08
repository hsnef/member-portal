'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const MEMBERSHIP_FEES = {
  Lifetime: 1001.00,
  Annual: 251.00,
  Community: 0,
}

function RenewMembershipForm() {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { member } = useAuth()

  const [loading, setLoading] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<'Lifetime' | 'Annual' | 'Community'>('Annual')
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

  const amount = MEMBERSHIP_FEES[selectedLevel]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Membership Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['Annual', 'Lifetime'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSelectedLevel(level)}
              className={`p-6 border-2 rounded-lg transition-all ${
                selectedLevel === level
                  ? 'border-[#FF9933] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="text-xl font-bold text-gray-900 mb-2">{level}</h4>
              <p className="text-3xl font-bold text-[#FF9933] mb-2">
                ${MEMBERSHIP_FEES[level].toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                {level === 'Annual' && 'Renew for one year'}
                {level === 'Lifetime' && 'One-time payment, valid forever'}
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
              className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!member) return

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 25100, // Default to Annual, will update based on selection
            memberId: member.id,
            category: 'Membership',
            description: 'Membership renewal',
            metadata: {
              membershipLevel: 'Annual',
            },
          }),
        })

        const data = await response.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        }
      } catch (error) {
        console.error('Error creating payment intent:', error)
      } finally {
        setLoading(false)
      }
    }

    createPaymentIntent()
  }, [member])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading payment form...</p>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Initialize Payment</h2>
          <p className="text-gray-600 mb-6">
            We couldn't set up the payment form. Please try again or contact support.
          </p>
          <button
            onClick={() => router.push('/member')}
            className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E]"
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
        colorPrimary: '#FF9933',
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
        <div className="bg-white shadow rounded-lg p-6">
          <Elements stripe={stripePromise} options={options}>
            <RenewMembershipForm />
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
