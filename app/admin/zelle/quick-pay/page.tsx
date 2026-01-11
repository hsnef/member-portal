'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ZellePaymentQR } from '@/components/zelle/ZellePaymentQR'
import { formatAmount } from '@/lib/zelle'
import type { PaymentPurpose } from '@/types/database'

interface ActiveRequest {
  reference_code: string
  amount: number
  purpose: string
  qrCode: string
  paymentUrl: string
  status: string
  expires_at: string
}

export default function QuickPayPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState<PaymentPurpose>('Donation')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  // Poll for status updates when request is active
  useEffect(() => {
    if (!activeRequest) return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/zelle/request/${activeRequest.reference_code}`)
        const data = await response.json()

        if (data.request?.status === 'member_confirmed') {
          // Member confirmed, show confirmation needed
          setActiveRequest(prev => prev ? { ...prev, status: 'member_confirmed' } : null)
        } else if (data.request?.status === 'auto_confirmed' || data.request?.status === 'staff_confirmed') {
          // Payment complete
          alert('Payment confirmed!')
          setActiveRequest(null)
        }
      } catch {
        // Ignore polling errors
      }
    }

    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [activeRequest])

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/zelle/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          purpose,
          description: description || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create payment request')
        return
      }

      setActiveRequest({
        reference_code: data.request.reference_code,
        amount: data.request.amount,
        purpose: data.request.purpose,
        qrCode: data.qrCode,
        paymentUrl: data.paymentUrl,
        status: data.request.status,
        expires_at: data.request.expires_at,
      })
    } catch {
      setError('Failed to create payment request')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!activeRequest) return

    try {
      await fetch('/api/zelle/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: activeRequest.reference_code }),
      })
    } catch {
      // Ignore
    }

    setActiveRequest(null)
    setAmount('')
    setDescription('')
  }

  const handleConfirm = async () => {
    if (!activeRequest) return

    try {
      const response = await fetch('/api/zelle/staff-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: activeRequest.reference_code }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to confirm')
        return
      }

      alert('Payment confirmed!')
      setActiveRequest(null)
      setAmount('')
      setDescription('')
    } catch {
      alert('Failed to confirm payment')
    }
  }

  // Fullscreen QR display
  if (fullscreen && activeRequest) {
    return (
      <div
        className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 cursor-pointer"
        onClick={() => setFullscreen(false)}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Scan to Pay</h1>
          <p className="text-6xl font-bold text-[#FF9933] mb-8">
            {formatAmount(activeRequest.amount)}
          </p>

          <ZellePaymentQR
            referenceCode={activeRequest.reference_code}
            amount={activeRequest.amount}
            purpose={activeRequest.purpose}
            showAmount={false}
            size={400}
          />

          <p className="mt-8 text-2xl font-mono text-gray-700">
            {activeRequest.reference_code}
          </p>

          {activeRequest.status === 'member_confirmed' && (
            <div className="mt-8 bg-blue-50 border-2 border-blue-400 rounded-xl px-8 py-4">
              <p className="text-xl font-semibold text-blue-800">
                Customer has sent payment - Click to confirm
              </p>
            </div>
          )}

          <p className="mt-8 text-gray-500">Tap anywhere to exit fullscreen</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quick Pay</h1>
              <p className="mt-1 text-sm text-gray-600">
                Generate a QR code for in-person Zelle payments
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/zelle')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Zelle Payments
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {activeRequest ? 'Active Payment Request' : 'Create Payment Request'}
              </h2>

              {!activeRequest ? (
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose
                    </label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value as PaymentPurpose)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    >
                      <option value="Donation">Donation</option>
                      <option value="Membership">Membership</option>
                      <option value="Event">Event</option>
                      <option value="Service">Service</option>
                      <option value="Sponsorship">Sponsorship</option>
                      <option value="Request">Other</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      placeholder="e.g., Ganesh Puja donation"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] disabled:bg-gray-300 font-semibold text-lg"
                  >
                    {loading ? 'Creating...' : 'Generate QR Code'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Active Request Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="text-3xl font-bold text-[#FF9933]">
                          {formatAmount(activeRequest.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Reference</p>
                        <p className="font-mono font-bold">{activeRequest.reference_code}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">{activeRequest.purpose}</p>
                    </div>
                  </div>

                  {/* Status */}
                  {activeRequest.status === 'member_confirmed' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                        <p className="font-medium text-blue-800">
                          Customer has sent payment!
                        </p>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        Please verify in your Zelle inbox and confirm below.
                      </p>
                    </div>
                  )}

                  {activeRequest.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                        <p className="font-medium text-yellow-800">
                          Waiting for customer to scan and pay...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    {activeRequest.status === 'member_confirmed' && (
                      <button
                        onClick={handleConfirm}
                        className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                      >
                        Confirm Payment
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setFullscreen(true)}
                    className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-gray-400 hover:bg-gray-50"
                  >
                    View Fullscreen (for display to customer)
                  </button>
                </div>
              )}
            </div>

            {/* QR Preview */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center">
              {activeRequest ? (
                <>
                  <ZellePaymentQR
                    referenceCode={activeRequest.reference_code}
                    amount={activeRequest.amount}
                    purpose={activeRequest.purpose}
                    size={300}
                  />
                  <p className="mt-4 text-sm text-gray-500 text-center">
                    Customer can scan this QR code to pay
                  </p>
                </>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">QR Code Preview</p>
                  <p className="text-sm">Enter an amount and click Generate</p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">How Quick Pay Works</h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Enter the payment amount and purpose</li>
              <li>Click &quot;Generate QR Code&quot; to create a unique payment request</li>
              <li>Show the QR code to the customer (use fullscreen for better visibility)</li>
              <li>Customer scans with their phone camera → opens payment page</li>
              <li>Customer sends Zelle payment from their bank app</li>
              <li>Customer marks &quot;I&apos;ve Sent&quot; on the page</li>
              <li>You&apos;ll see the status update → Click &quot;Confirm Payment&quot; after verifying in Zelle</li>
            </ol>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
