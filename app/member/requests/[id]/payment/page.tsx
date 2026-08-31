'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Request Summary */}
      <div className="bg-transparent rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">{request.request_type}</span>
            <span className="font-medium">${request.amount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-saffron text-lg">${request.amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Element */}
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
          onClick={() => router.push('/member/requests')}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-transparent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Processing...' : `Pay $${request.amount.toFixed(2)}`}
        </button>
      </div>
    </form>
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
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#c75b12',
      },
    },
  }

  return (
    <div className="bg-transparent py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/member/requests')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Requests
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Pay for Service Request</h1>
          <p className="mt-2 text-gray-600">
            Complete your payment for the requested service
          </p>
        </div>

        {/* Request Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">
              {request.request_type === 'Puja' ? '🙏' :
               request.request_type === 'Sponsorship' ? '💝' :
               request.request_type === 'Service' ? '⚙️' :
               request.request_type === 'Facility Rental' ? '🏛️' : '📋'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">{request.request_type}</h3>
              <p className="text-sm text-blue-700 mt-1">{request.service_description}</p>
              <p className="text-xs text-blue-600 mt-2">
                Requested for: {new Date(request.requested_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <Elements stripe={stripePromise} options={options}>
            <RequestPaymentForm request={request} />
          </Elements>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Secure payment powered by Stripe</p>
          <p className="mt-1">Your payment information is encrypted and secure</p>
        </div>

        {/* Receipt Notice */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Receipt will be emailed</h3>
              <p className="mt-1 text-sm text-green-700">
                Upon successful payment, a receipt will be emailed to you and will also be available in your Payment History.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RequestPaymentPage() {
  return (
    <>
      <RequestPaymentContent />
    </>
  )
}
