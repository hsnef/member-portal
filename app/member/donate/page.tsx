'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useAuth } from '@/lib/auth/AuthContext'
import { ZellePaymentOption } from '@/components/zelle/ZellePaymentOption'
import { ZelleInstructions } from '@/components/zelle/ZelleInstructions'
import { ZelleConfirmationForm } from '@/components/zelle/ZelleConfirmationForm'
import { formatAmount } from '@/lib/zelle'
import { DonateView, type DonatePaymentMethod } from '@/components/member/DonateView'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { CreditCardIcon } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { stripeAppearance } from '@/components/member/CheckoutView'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

type PaymentMethod = DonatePaymentMethod

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <CardHeader
          title="Card details"
          description="Processed by Stripe. HSNEF never sees or stores your card number."
        />
        {message && (
          <div className="mb-5">
            <Alert tone="danger" title="That payment didn't go through">
              {message}
            </Alert>
          </div>
        )}
        <PaymentElement />
        <Button
          type="submit"
          size="lg"
          fullWidth
          icon={CreditCardIcon}
          loading={loading}
          disabled={!stripe || amount <= 0}
          className="mt-6"
        >
          Donate {formatCurrency(amount, true)}
        </Button>
      </Card>
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
      <div className="flex items-center justify-center bg-transparent">
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
      <div className="bg-transparent flex items-center justify-center px-4">
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
      <div className="flex items-center justify-center bg-transparent">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Initialize Payment</h2>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t set up the card payment form. Try using Zelle instead.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/member')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-transparent"
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
    appearance: stripeAppearance,
  } : undefined

  return (
    <DonateView
      amount={amount}
      onAmountChange={handleAmountChange}
      purpose={purpose}
      onPurposeChange={handlePurposeChange}
      paymentMethod={paymentMethod}
      onPaymentMethodChange={handlePaymentMethodChange}
      updating={updatingPayment}
      zelleOption={
        <ZellePaymentOption
          selected={paymentMethod === 'zelle'}
          onSelect={() => handlePaymentMethodChange('zelle')}
          disabled={!zelleSettings?.enabled}
        />
      }
      zelleSurface={
        zelleSuccess ? (
          <Alert tone="success" title="Thank you — we have your Zelle confirmation">
            The office will match your transfer and email your receipt. It usually takes one
            working day.
          </Alert>
        ) : zelleRequest ? (
          <div className="space-y-5">
            <ZelleInstructions
              zelleEmail={zelleSettings?.zelle_email}
              zellePhone={zelleSettings?.zelle_phone}
              referenceCode={zelleRequest.reference_code}
              amount={zelleRequest.amount}
              purpose={`Donation - ${purpose}`}
              instructions={zelleSettings?.instructions}
            />
            <ZelleConfirmationForm
              referenceCode={zelleRequest.reference_code}
              onConfirm={handleZelleConfirm}
              onCancel={() => setZelleRequest(null)}
              loading={zelleLoading}
            />
          </div>
        ) : (
          <Card>
            <CardHeader
              title="Pay by Zelle"
              description="We will give you a reference code to include with your transfer."
            />
            <Button
              size="lg"
              fullWidth
              loading={zelleLoading}
              disabled={amount <= 0}
              onClick={createZelleRequest}
            >
              Continue with Zelle
            </Button>
          </Card>
        )
      }
      cardSurface={
        clientSecret && options ? (
          <Elements stripe={stripePromise} options={options} key={clientSecret}>
            <DonationForm
              amount={amount}
              setAmount={handleAmountChange}
              purpose={purpose}
              setPurpose={handlePurposeChange}
            />
          </Elements>
        ) : (
          <Card>
            <Skeleton className="h-40 w-full" />
          </Card>
        )
      }
    />
  )
}

export default function DonatePage() {
  return (
    <>
      <DonateContent />
    </>
  )
}
