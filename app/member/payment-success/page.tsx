'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)
  const [confirmingPayment, setConfirmingPayment] = useState(true)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const type = searchParams.get('type') || 'payment'
  const amount = searchParams.get('amount')
  const level = searchParams.get('level')
  const paymentIntent = searchParams.get('payment_intent')

  // Confirm payment and save to database
  useEffect(() => {
    const confirmPayment = async () => {
      if (!paymentIntent) {
        setConfirmingPayment(false)
        return
      }

      try {
        const response = await fetch('/api/stripe/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent }),
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('Payment confirmation error:', data)
          setPaymentError(data.error || 'Failed to confirm payment')
        }
      } catch (err) {
        console.error('Error confirming payment:', err)
        setPaymentError('Failed to confirm payment')
      } finally {
        setConfirmingPayment(false)
      }
    }

    confirmPayment()
  }, [paymentIntent])

  // Start countdown only after payment is confirmed
  useEffect(() => {
    if (confirmingPayment) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/member')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, confirmingPayment])

  // Show loading while confirming payment
  if (confirmingPayment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Confirming your payment...</h2>
          <p className="text-gray-600 mt-2">Please wait while we verify your payment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Error Message if any */}
        {paymentError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
            <p className="text-sm text-yellow-800">Note: {paymentError}. Your payment was successful but there may be a delay in recording it.</p>
          </div>
        )}

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>

        {type === 'membership' && (
          <p className="text-gray-600 mb-6">
            Your {level} membership has been {level === 'Lifetime' ? 'activated' : 'renewed'} successfully.
          </p>
        )}

        {type === 'donation' && (
          <p className="text-gray-600 mb-6">
            Thank you for your generous donation of ${amount}! Your support makes a difference.
          </p>
        )}

        {/* What's Next */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">What's Next?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Payment confirmation sent to your email</li>
            <li>✓ Receipt will be generated shortly</li>
            {type === 'membership' && <li>✓ Your membership pass has been updated</li>}
            {type === 'donation' && <li>✓ Tax receipt will be emailed for your records</li>}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/member')}
            className="w-full px-6 py-3 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] font-semibold"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/member/payments')}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            View Payment History
          </button>
        </div>

        {/* Auto-redirect Notice */}
        <p className="mt-6 text-sm text-gray-500">
          Redirecting to dashboard in {countdown} seconds...
        </p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </ProtectedRoute>
  )
}
