'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const SUGGESTED_DONATIONS = [25, 51, 101, 251, 501, 1001]

function DonationForm({ amount, setAmount }: { amount: number; setAmount: (amt: number) => void }) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { member } = useAuth()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [purpose, setPurpose] = useState('General')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !member) {
      return
    }

    if (amount <= 0) {
      setMessage('Please enter a valid donation amount')
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/member/payment-success?type=donation&amount=${amount}`,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Suggested Amounts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Donation Amounts</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {SUGGESTED_DONATIONS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => {
                setAmount(amt)
                setCustomAmount('')
              }}
              className={`py-3 px-4 border-2 rounded-lg font-semibold transition-all ${
                amount === amt && !customAmount
                  ? 'border-[#FF9933] bg-orange-50 text-[#FF9933]'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or enter a custom amount
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            step="0.01"
            min="1"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value)
              setAmount(parseFloat(e.target.value) || 0)
            }}
            className="pl-7 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Donation Purpose (Optional)
        </label>
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
        >
          <option value="General">General Temple Fund</option>
          <option value="Building">Building & Maintenance</option>
          <option value="Festival">Festival Sponsorship</option>
          <option value="Education">Education Programs</option>
          <option value="Annadanam">Annadanam (Food Service)</option>
          <option value="Priest">Priest Support</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {amount > 0 && (
        <>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            <PaymentElement />
          </div>

          {/* Tax Deductible Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Tax Deductible</h3>
                <p className="mt-1 text-sm text-green-700">
                  Your donation is tax-deductible. A receipt will be emailed to you for your records.
                </p>
              </div>
            </div>
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
              disabled={!stripe || loading || amount <= 0}
              className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Processing...' : `Donate $${amount.toFixed(2)}`}
            </button>
          </div>
        </>
      )}
    </form>
  )
}

function DonateContent() {
  const router = useRouter()
  const { member } = useAuth()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState(51)

  useEffect(() => {
    if (!member) return

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount * 100, // Convert to cents
            memberId: member.id,
            category: 'Donation',
            description: 'Temple donation',
            metadata: {
              purpose: 'General',
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
          <p className="mt-4 text-gray-600">Loading donation form...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Make a Donation</h1>
          <p className="mt-2 text-gray-600">
            Support HSNEF and help us continue serving the community
          </p>
        </div>

        {/* Donation Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <Elements stripe={stripePromise} options={options}>
            <DonationForm amount={amount} setAmount={setAmount} />
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

export default function DonatePage() {
  return (
    <ProtectedRoute>
      <DonateContent />
    </ProtectedRoute>
  )
}
