'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function RequestPaymentSuccessPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { member } = useAuth()
  const supabase = createClient()

  const requestId = params.id as string
  const paymentIntentId = searchParams.get('payment_intent')

  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState<{ request_type: string; amount: number } | null>(null)

  useEffect(() => {
    if (!member || !requestId || !paymentIntentId) {
      setVerifying(false)
      setError('Missing payment information')
      return
    }

    const verifyAndUpdatePayment = async () => {
      try {
        // Verify payment with Stripe
        const verifyResponse = await fetch('/api/stripe/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId }),
        })

        const verifyData = await verifyResponse.json()

        if (verifyData.status !== 'succeeded') {
          setError('Payment was not successful. Please try again.')
          setVerifying(false)
          return
        }

        // Fetch request details
        const { data: requestData, error: fetchError } = await supabase
          .from('requests')
          .select('request_type, amount, status')
          .eq('id', requestId)
          .single()

        if (fetchError || !requestData) {
          setError('Could not verify request')
          setVerifying(false)
          return
        }

        setRequest(requestData)

        // Update request status to Paid if not already
        if (requestData.status !== 'Paid' && requestData.status !== 'Completed') {
          await supabase
            .from('requests')
            .update({ status: 'Paid' })
            .eq('id', requestId)
        }

        setVerified(true)
      } catch (err) {
        console.error('Error verifying payment:', err)
        setError('An error occurred while verifying payment')
      } finally {
        setVerifying(false)
      }
    }

    verifyAndUpdatePayment()
  }, [member, requestId, paymentIntentId, supabase])

  // Auto-redirect after 5 seconds
  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => {
        router.push('/member/requests')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [verified, router])

  if (verifying) {
    return (
      <>
        <div className="flex items-center justify-center bg-transparent">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Verifying your payment...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="flex items-center justify-center bg-transparent">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Verification Issue</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/member/requests')}
              className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your payment. Your service request has been marked as paid.
          </p>

          {/* Payment Details */}
          {request && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-left">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Payment Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium">{request.request_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-bold text-green-600">${request.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                    Paid
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Confirmation email has been sent</li>
              <li>✓ Receipt is available in Payment History</li>
              <li>✓ The temple will process your request</li>
              <li>✓ You'll be notified when service is scheduled</li>
            </ul>
          </div>

          {/* Auto-redirect Notice */}
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to your requests in 5 seconds...
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/member/requests')}
              className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold"
            >
              View My Requests
            </button>
            <button
              onClick={() => router.push('/member/payments')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-transparent"
            >
              Payment History
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
