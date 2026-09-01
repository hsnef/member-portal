'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLink } from '@/components/nav/Nav'
import { Button } from '@/components/ui/Button'
import { PaymentOutcomeView } from '@/components/member/PaymentOutcomeView'
import { formatCurrency } from '@/utils/format'

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

  const numericAmount = amount ? Number(amount) : null

  const description =
    type === 'membership'
      ? `Your ${level} membership has been ${level === 'Lifetime' ? 'activated' : 'renewed'} successfully.`
      : type === 'donation'
        ? 'Thank you for your generous donation — your support makes a real difference.'
        : 'Your payment went through. A receipt is on its way to your email.'

  const facts: Array<{ label: string; value: React.ReactNode }> = []
  if (numericAmount !== null && !Number.isNaN(numericAmount)) {
    facts.push({ label: 'Amount', value: formatCurrency(numericAmount, true) })
  }
  if (type === 'membership' && level) {
    facts.push({ label: 'Membership', value: level })
  }

  return (
    <PaymentOutcomeView
      state={confirmingPayment ? 'confirming' : 'success'}
      title="Thank you — you're all set"
      description={description}
      facts={facts.length > 0 ? facts : undefined}
      warning={paymentError}
      actions={
        <>
          <AppLink to="/member">
            <Button size="lg">Back to my portal</Button>
          </AppLink>
          <AppLink to="/member/payments">
            <Button size="lg" variant="secondary">
              View payment history
            </Button>
          </AppLink>
        </>
      }
      footnote={
        <>
          A confirmation email is on its way, and your receipt will be available under Payments.
          {type === 'donation' && ' A tax receipt will be emailed for your records.'}
          {' '}Taking you back to your portal in {countdown}s.
        </>
      }
    />
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <PaymentOutcomeView state="confirming" title="" description="" />
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
