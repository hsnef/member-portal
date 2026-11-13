'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useAuth } from '@/lib/auth/AuthContext'
import { ZelleCheckout } from '@/components/zelle/ZelleCheckout'
import { DonateView, type DonatePaymentMethod } from '@/components/member/DonateView'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { CreditCardIcon } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { stripeAppearance } from '@/components/member/CheckoutView'
import { NoMembershipState } from '@/components/member/NoMembershipState'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

type PaymentMethod = DonatePaymentMethod

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

  // Zelle is offered only when an Admin has switched it on (and set where to send).
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [zelleAvailable, setZelleAvailable] = useState(false)
  useEffect(() => {
    fetch('/api/zelle/settings')
      .then((r) => r.json())
      .then((d) => setZelleAvailable(!!d.available))
      .catch(() => setZelleAvailable(false))
  }, [])

  // Create payment intent
  const createPaymentIntent = async (donationAmount: number, donationPurpose: string) => {
    if (!member) return null

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The server decides what is charged; a donation is the one item
        // whose amount the member chooses (checked against the limits).
        body: JSON.stringify({
          item: { kind: 'donation', amount: donationAmount, fund: donationPurpose },
        }),
      })

      const data = await response.json()
      return data.clientSecret || null
    } catch (error) {
      console.error('Error creating payment intent:', error)
      return null
    }
  }

  // Handle amount change - recreate payment intent
  const handleAmountChange = async (newAmount: number) => {
    setAmount(newAmount)
    if (newAmount <= 0) return

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
            {zelleAvailable && (
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

  if (!member) {
    return <NoMembershipState detail="no membership to donate against" />
  }

  return (
    <DonateView
      amount={amount}
      onAmountChange={handleAmountChange}
      purpose={purpose}
      onPurposeChange={handlePurposeChange}
      paymentMethod={paymentMethod}
      onPaymentMethodChange={handlePaymentMethodChange}
      updating={updatingPayment}
      zelleAvailable={zelleAvailable}
      zelleSurface={
        <Card>
          <CardHeader title="Pay by Zelle" description="We give you a reference code to put in the Zelle memo." />
          {/* key: a new request when the amount or fund changes. */}
          <ZelleCheckout key={`${amount}-${purpose}`} item={amount > 0 ? { kind: 'donation', amount, fund: purpose } : null} />
        </Card>
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
