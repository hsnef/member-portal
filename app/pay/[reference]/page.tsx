'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ZelleInstructions } from '@/components/zelle/ZelleInstructions'
import { ZellePaymentQR } from '@/components/zelle/ZellePaymentQR'
import { ZelleConfirmationForm } from '@/components/zelle/ZelleConfirmationForm'
import { getStatusLabel, getStatusColor, getTimeRemaining, formatAmount } from '@/lib/zelle'

interface PaymentRequestData {
  request: {
    id: string
    reference_code: string
    amount: number
    purpose: string
    description: string | null
    status: string
    expires_at: string
    created_at: string
    member_confirmed_at: string | null
  }
  member: {
    membershipId: string
    name: string
    email: string
  } | null
  zelle: {
    email: string
    phone: string
    instructions: string
  }
  qrCode: string
  paymentUrl: string
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const reference = params.reference as string

  const [data, setData] = useState<PaymentRequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [autoConfirmed, setAutoConfirmed] = useState(false)

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/zelle/request/${reference}`)
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Failed to load payment request')
          return
        }

        setData(result)
      } catch {
        setError('Failed to load payment request')
      } finally {
        setLoading(false)
      }
    }

    fetchRequest()
  }, [reference])

  const handleConfirm = async (zelleReference?: string) => {
    setConfirmLoading(true)

    try {
      const response = await fetch('/api/zelle/confirm-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          zelleReference,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to confirm payment')
        return
      }

      setSuccess(true)
      setAutoConfirmed(result.autoConfirmed)
    } catch {
      setError('Failed to confirm payment')
    } finally {
      setConfirmLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Request Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {autoConfirmed ? 'Payment Confirmed!' : 'Payment Marked as Sent'}
            </h1>
            <p className="text-gray-600 mb-2">
              {autoConfirmed
                ? 'Your payment has been automatically confirmed. A receipt will be sent to your email.'
                : 'Thank you! Our staff will verify your payment shortly and send you a confirmation.'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Reference: <span className="font-mono font-bold">{reference}</span>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/member')}
                className="w-full px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
              >
                Go to My Dashboard
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { request, member, zelle } = data
  const isExpired = new Date(request.expires_at) < new Date()
  const isPending = request.status === 'pending'
  const isMemberConfirmed = request.status === 'member_confirmed'
  const isConfirmed = request.status === 'staff_confirmed' || request.status === 'auto_confirmed'

  // Already confirmed state
  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Already Confirmed</h1>
            <p className="text-gray-600 mb-4">
              This payment has already been confirmed. Thank you!
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(request.amount)}</p>
              <p className="text-sm text-gray-500 mt-2">Reference: {request.reference_code}</p>
            </div>
            <button
              onClick={() => router.push('/member')}
              className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Expired state
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Request Expired</h1>
            <p className="text-gray-600 mb-6">
              This payment request has expired. Please contact us for a new payment link.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">HSNEF Temple</h1>
          <p className="text-gray-600 mt-1">Zelle Payment</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Status Banner */}
          {isMemberConfirmed && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <p className="text-blue-800 font-medium">
                  Payment sent - awaiting staff confirmation
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Member Info (if linked) */}
            {member && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500">Paying as</p>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-600">{member.membershipId}</p>
              </div>
            )}

            {/* QR Code Section (for showing others) */}
            <div className="flex justify-center mb-6">
              <ZellePaymentQR
                referenceCode={request.reference_code}
                amount={request.amount}
                purpose={request.purpose}
                showAmount={false}
                size={180}
              />
            </div>

            {/* Payment Instructions */}
            {isPending && (
              <>
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Payment Instructions
                  </h2>
                  <ZelleInstructions
                    zelleEmail={zelle.email}
                    zellePhone={zelle.phone}
                    referenceCode={request.reference_code}
                    amount={request.amount}
                    purpose={request.purpose}
                    instructions={zelle.instructions}
                  />
                </div>

                {/* Confirmation Form */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    After You Send the Payment
                  </h2>
                  <ZelleConfirmationForm
                    referenceCode={request.reference_code}
                    onConfirm={handleConfirm}
                    loading={confirmLoading}
                  />
                </div>
              </>
            )}

            {/* Status for member-confirmed */}
            {isMemberConfirmed && (
              <div className="border-t border-gray-200 pt-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    You marked this payment as sent on{' '}
                    {new Date(request.member_confirmed_at!).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Our staff will verify receipt and send you a confirmation.
                  </p>
                </div>
              </div>
            )}

            {/* Expiry Notice */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Reference: <span className="font-mono">{request.reference_code}</span></span>
                <span className={`px-2 py-1 rounded ${getStatusColor(request.status as any)}`}>
                  Expires: {getTimeRemaining(request.expires_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact us at info@hsnef.org</p>
        </div>
      </div>
    </div>
  )
}
