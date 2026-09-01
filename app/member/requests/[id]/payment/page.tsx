'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CheckoutView, stripeAppearance } from '@/components/member/CheckoutView'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface RequestDetails {
  id: string
  request_type: string
  service_description: string
  requested_date: string
  amount: number
  status: string
  notes?: string
  created_at: string
}

function RequestPaymentForm({ request }: { request: RequestDetails }) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/member/requests/${request.id}/payment-success`,
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
    <CheckoutView
      eyebrow={`Request ${request.id.slice(0, 8).toUpperCase()}`}
      title="Pay for your service request"
      description="Your request is marked paid once this clears. A receipt is emailed immediately."
      summaryItems={[
        { label: 'Service', value: request.request_type },
        { label: 'Description', value: request.service_description },
        {
          label: 'Requested for',
          value: new Date(request.requested_date).toLocaleDateString(),
          numeric: true,
        },
      ]}
      lineItems={[{ label: request.request_type, amount: Number(request.amount) }]}
      total={Number(request.amount)}
      paymentElement={<PaymentElement />}
      onSubmit={handleSubmit}
      submitting={loading}
      disabled={!stripe}
      error={message}
      reference={request.id.slice(0, 8).toUpperCase()}
      backHref="/member/requests"
      backLabel="Back to my requests"
    />
  )
}

function RequestPaymentContent() {
  const router = useRouter()
  const params = useParams()
  const { member } = useAuth()
  const supabase = createClient()

  const requestId = params.id as string

  const [request, setRequest] = useState<RequestDetails | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!member || !requestId) return

    const initializePayment = async () => {
      try {
        // Fetch request details
        const { data: requestData, error: requestError } = await supabase
          .from('requests')
          .select('*')
          .eq('id', requestId)
          .eq('member_id', member.id)
          .single()

        if (requestError || !requestData) {
          setError('Request not found or access denied')
          setLoading(false)
          return
        }

        // Check if request is in Sent status (ready for payment)
        if (requestData.status !== 'Sent') {
          setError(`This request is not ready for payment. Current status: ${requestData.status}`)
          setLoading(false)
          return
        }

        setRequest(requestData)

        // Create payment intent
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(requestData.amount * 100), // Convert to cents
            memberId: member.id,
            category: 'Request',
            description: `${requestData.request_type}: ${requestData.service_description.substring(0, 50)}`,
            metadata: {
              requestId: requestData.id,
              requestType: requestData.request_type,
            },
          }),
        })

        const data = await response.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError('Failed to initialize payment')
        }
      } catch (err) {
        console.error('Error initializing payment:', err)
        setError('An error occurred while loading the payment form')
      } finally {
        setLoading(false)
      }
    }

    initializePayment()
  }, [member, requestId, supabase])

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

  if (error || !request || !clientSecret) {
    return (
      <div className="flex items-center justify-center bg-transparent">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Process Payment</h2>
          <p className="text-gray-600 mb-6">
            {error || 'We couldn\'t set up the payment form. Please try again.'}
          </p>
          <button
            onClick={() => router.push('/member/requests')}
            className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
          >
            Back to Requests
          </button>
        </div>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: stripeAppearance,
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <RequestPaymentForm request={request} />
    </Elements>
  )
}

export default function RequestPaymentPage() {
  return <RequestPaymentContent />
}
