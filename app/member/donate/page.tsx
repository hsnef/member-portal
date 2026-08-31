'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import { ZellePaymentOption } from '@/components/zelle/ZellePaymentOption'
import { ZelleInstructions } from '@/components/zelle/ZelleInstructions'
import { ZelleConfirmationForm } from '@/components/zelle/ZelleConfirmationForm'
import { formatAmount } from '@/lib/zelle'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

type PaymentMethod = 'card' | 'zelle'

interface ZelleSettings {
  enabled: boolean
  hasEmail: boolean
  hasPhone: boolean
  zelle_email: string
  zelle_phone: string
  instructions: string
}

interface ZelleRequest {
  reference_code: string
  amount: number
  purpose: string
  status: string
}

const SUGGESTED_DONATIONS = [25, 51, 101, 251, 501, 1001]

function DonationForm({
  amount,
  setAmount,
  purpose,
  setPurpose
}: {
  amount: number
  setAmount: (amt: number) => void
  purpose: string
  setPurpose: (purpose: string) => void
}) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { member } = useAuth()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')

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
          return_url: `${window.location.origin}/member/payment-success?type=donation&amount=${amount}&purpose=${encodeURIComponent(purpose)}`,
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
                  ? 'border-saffron bg-orange-50 text-saffron'
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
            className="pl-7 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
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
              className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
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
  const [purpose, setPurpose] = useState('General')
  const [updatingPayment, setUpdatingPayment] = useState(false)

  // Zelle states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [zelleSettings, setZelleSettings] = useState<ZelleSettings | null>(null)
  const [zelleRequest, setZelleRequest] = useState<ZelleRequest | null>(null)
  const [zelleLoading, setZelleLoading] = useState(false)
  const [zelleSuccess, setZelleSuccess] = useState(false)

  // Fetch Zelle settings
  useEffect(() => {
    const fetchZelleSettings = async () => {
      try {
        const response = await fetch('/api/zelle/settings')
        const data = await response.json()
        setZelleSettings(data)
      } catch {
        console.error('Error fetching Zelle settings')
      }
    }
    fetchZelleSettings()
  }, [])

  // Create payment intent
  const createPaymentIntent = async (donationAmount: number, donationPurpose: string) => {
    if (!member) return null

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(donationAmount * 100), // Convert to cents
          memberId: member.id,
          category: 'Donation',
          description: `Donation - ${donationPurpose}`,
          metadata: {
            purpose: donationPurpose,
          },
        }),
      })

      const data = await response.json()
      return data.clientSecret || null
    } catch (error) {
      console.error('Error creating payment intent:', error)
      return null
    }
  }

  // Create Zelle request
  const createZelleRequest = async () => {
    if (!member || amount <= 0) return

    setZelleLoading(true)
    try {
      const response = await fetch('/api/zelle/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          amount,
          purpose: 'Donation',
          description: `Donation - ${purpose}`,
        }),
      })

      const data = await response.json()
      if (data.success && data.request) {
        setZelleRequest(data.request)
      } else {
        alert(data.error || 'Failed to create Zelle request')
      }
    } catch {
      alert('Failed to create Zelle request')
    } finally {
      setZelleLoading(false)
    }
  }

  // Handle Zelle confirmation
  const handleZelleConfirm = async (zelleReference?: string) => {
    if (!zelleRequest) return

    setZelleLoading(true)
    try {
      const response = await fetch('/api/zelle/confirm-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: zelleRequest.reference_code,
          zelleReference,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setZelleSuccess(true)
      } else {
        alert(data.error || 'Failed to confirm payment')
      }
    } catch {
      alert('Failed to confirm payment')
    } finally {
      setZelleLoading(false)
    }
  }

  // Handle amount change - recreate payment intent
  const handleAmountChange = async (newAmount: number) => {
    setAmount(newAmount)
    if (newAmount <= 0) return

    // Reset Zelle request if amount changes
    if (zelleRequest) {
      setZelleRequest(null)
    }

    if (paymentMethod === 'card') {
      setUpdatingPayment(true)
      const newSecret = await createPaymentIntent(newAmount, purpose)
      if (newSecret) {
        setClientSecret(newSecret)
      }
      setUpdatingPayment(false)
    }
  }

  // Handle purpose change - update metadata
  const handlePurposeChange = async (newPurpose: string) => {
    setPurpose(newPurpose)

    // Reset Zelle request if purpose changes
    if (zelleRequest) {
      setZelleRequest(null)
    }

    if (paymentMethod === 'card') {
      setUpdatingPayment(true)
      const newSecret = await createPaymentIntent(amount, newPurpose)
      if (newSecret) {
        setClientSecret(newSecret)
      }
      setUpdatingPayment(false)
    }
  }

  // Handle payment method change
  const handlePaymentMethodChange = async (method: PaymentMethod) => {
    setPaymentMethod(method)
    setZelleRequest(null)

    if (method === 'card' && !clientSecret && amount > 0) {
      setUpdatingPayment(true)
      const newSecret = await createPaymentIntent(amount, purpose)
      if (newSecret) {
        setClientSecret(newSecret)
      }
      setUpdatingPayment(false)
    }
  }

  useEffect(() => {
    if (!member) return

    const initializePayment = async () => {
      const secret = await createPaymentIntent(amount, purpose)
      if (secret) {
        setClientSecret(secret)
      }
      setLoading(false)
    }

    initializePayment()
  }, [member])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading donation form...</p>
        </div>
      </div>
    )
  }

  // Zelle success state
  if (zelleSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Thank You for Your Donation!</h1>
            <p className="text-gray-600 mb-4">
              Your Zelle payment has been recorded. A receipt will be sent to your email once confirmed.
            </p>
            <p className="text-2xl font-bold text-saffron mb-6">{formatAmount(amount)}</p>
            <button
              onClick={() => router.push('/member')}
              className="w-full px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check for errors on card payment init
  if (paymentMethod === 'card' && !clientSecret && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Initialize Payment</h2>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t set up the card payment form. Try using Zelle instead.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/member')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Go Back
            </button>
            {zelleSettings?.enabled && (
              <button
                onClick={() => setPaymentMethod('zelle')}
                className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
              >
                Pay with Zelle
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#c75b12',
      },
    },
  } : undefined

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

        {/* Payment Method Selection */}
        {zelleSettings?.enabled && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h2>
            <div className="space-y-3">
              {/* Card Option */}
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('card')}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all text-left
                  ${paymentMethod === 'card'
                    ? 'border-saffron bg-saffron-soft'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${paymentMethod === 'card' ? 'border-saffron' : 'border-gray-300'}
                    `}
                  >
                    {paymentMethod === 'card' && <div className="w-3 h-3 rounded-full bg-saffron" />}
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Credit/Debit Card</p>
                    <p className="text-sm text-gray-500">Pay securely via Stripe</p>
                  </div>
                </div>
              </button>

              {/* Zelle Option */}
              <ZellePaymentOption
                selected={paymentMethod === 'zelle'}
                onSelect={() => handlePaymentMethodChange('zelle')}
              />
            </div>
          </div>
        )}

        {/* Donation Form */}
        <div className="bg-white shadow rounded-lg p-6 relative">
          {(updatingPayment || zelleLoading) && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-saffron border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-600">
                  {zelleLoading ? 'Processing...' : 'Updating...'}
                </p>
              </div>
            </div>
          )}

          {/* Card Payment Flow */}
          {paymentMethod === 'card' && clientSecret && options && (
            <Elements stripe={stripePromise} options={options} key={clientSecret}>
              <DonationForm
                amount={amount}
                setAmount={handleAmountChange}
                purpose={purpose}
                setPurpose={handlePurposeChange}
              />
            </Elements>
          )}

          {/* Zelle Payment Flow */}
          {paymentMethod === 'zelle' && (
            <div className="space-y-6">
              {/* Amount Selection (copied from DonationForm) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Donation Amount</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {SUGGESTED_DONATIONS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAmountChange(amt)}
                      className={`py-3 px-4 border-2 rounded-lg font-semibold transition-all ${
                        amount === amt
                          ? 'border-saffron bg-orange-50 text-saffron'
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
                    value={amount || ''}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                    className="pl-7 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => handlePurposeChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
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

              {/* Zelle Instructions or Create Request */}
              {amount > 0 && !zelleRequest && (
                <div className="border-t pt-6">
                  <button
                    onClick={createZelleRequest}
                    className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold"
                  >
                    Continue with Zelle Payment
                  </button>
                </div>
              )}

              {/* Show Zelle Instructions */}
              {zelleRequest && zelleSettings && (
                <div className="border-t pt-6">
                  <ZelleInstructions
                    zelleEmail={zelleSettings.zelle_email}
                    zellePhone={zelleSettings.zelle_phone}
                    referenceCode={zelleRequest.reference_code}
                    amount={zelleRequest.amount}
                    purpose={`Donation - ${purpose}`}
                    instructions={zelleSettings.instructions}
                  />

                  <div className="mt-6">
                    <ZelleConfirmationForm
                      referenceCode={zelleRequest.reference_code}
                      onConfirm={handleZelleConfirm}
                      onCancel={() => setZelleRequest(null)}
                      loading={zelleLoading}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {paymentMethod === 'card' ? (
            <>
              <p>🔒 Secure payment powered by Stripe</p>
              <p className="mt-1">Your payment information is encrypted and secure</p>
            </>
          ) : (
            <>
              <p>💸 Pay directly from your bank - no fees!</p>
              <p className="mt-1">Zelle is free, fast, and secure</p>
            </>
          )}
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
