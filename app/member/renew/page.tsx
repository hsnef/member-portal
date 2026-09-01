'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { RenewView, type RenewLevel } from '@/components/member/RenewView'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { CreditCardIcon } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { useAuth } from '@/lib/auth/AuthContext'
import { getMembershipPricing, type MembershipPricing } from '@/lib/utils/portalSettings'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function RenewMembershipForm({
  pricing,
  selectedLevel,
  onLevelChange
}: {
  pricing: MembershipPricing
  selectedLevel: RenewLevel
  onLevelChange: (level: RenewLevel) => void
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
    <form onSubmit={handleSubmit}>
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
          disabled={!stripe}
          className="mt-6"
        >
          Pay {formatCurrency(amount, true)}
        </Button>
      </Card>
    </form>
  )
}

function RenewMembershipContent() {
  const router = useRouter()
  const { member } = useAuth()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pricing, setPricing] = useState<MembershipPricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<RenewLevel>('annual')
  const [updatingPayment, setUpdatingPayment] = useState(false)

  // Create or update payment intent based on selected level
  const createPaymentIntent = useCallback(async (level: RenewLevel, membershipPricing: MembershipPricing) => {
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
  const handleLevelChange = async (level: RenewLevel) => {
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
      <div className="flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading payment form...</p>
        </div>
      </div>
    )
  }

  if (!clientSecret || !pricing) {
    return (
      <div className="flex items-center justify-center bg-transparent">
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
    <RenewView
      pricing={pricing}
      selectedLevel={selectedLevel}
      onLevelChange={handleLevelChange}
      currentLevel={member?.current_level ?? null}
      updating={updatingPayment}
      paymentSurface={
        clientSecret ? (
          <Elements stripe={stripePromise} options={options} key={clientSecret}>
            <RenewMembershipForm
              pricing={pricing}
              selectedLevel={selectedLevel}
              onLevelChange={handleLevelChange}
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

export default function RenewMembershipPage() {
  return (
    <>
      <RenewMembershipContent />
    </>
  )
}
