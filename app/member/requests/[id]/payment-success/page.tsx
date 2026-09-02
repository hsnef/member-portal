'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { AppLink } from '@/components/nav/Nav'
import { Button } from '@/components/ui/Button'
import { PaymentOutcomeView } from '@/components/member/PaymentOutcomeView'
import { formatCurrency } from '@/utils/format'

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

  return (
    <PaymentOutcomeView
      state={verifying ? 'confirming' : error ? 'error' : 'success'}
      confirmingLabel="Verifying your payment…"
      title={error ? 'We could not verify this payment' : 'Payment received — thank you'}
      description={
        error
          ? `${error} If money left your account, do not pay again — contact the temple office and we will sort it out.`
          : 'Your request is now marked as paid. A receipt is on its way to your email.'
      }
      facts={
        !error && request
          ? [
              { label: 'Request', value: request.request_type },
              { label: 'Amount', value: formatCurrency(request.amount, true) },
            ]
          : undefined
      }
      actions={
        <>
          <AppLink to="/member/requests">
            <Button size="lg">Back to my requests</Button>
          </AppLink>
          {!error && (
            <AppLink to="/member/payments">
              <Button size="lg" variant="secondary">
                View payment history
              </Button>
            </AppLink>
          )}
        </>
      }
      footnote={
        error
          ? undefined
          : 'Taking you back to your requests in a moment. Receipts are always available under Payments.'
      }
    />
  )
}
