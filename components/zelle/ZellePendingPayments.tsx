'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatAmount, getTimeRemaining, getStatusLabel, getStatusColor } from '@/lib/zelle'
import type { ZellePaymentRequest } from '@/types/database'

interface ZellePendingPaymentsProps {
  memberId: string
  compact?: boolean
}

export function ZellePendingPayments({ memberId, compact = false }: ZellePendingPaymentsProps) {
  const router = useRouter()
  const [requests, setRequests] = useState<ZellePaymentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('zelle_payment_requests')
        .select('*')
        .eq('member_id', memberId)
        .in('status', ['pending', 'member_confirmed'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error fetching Zelle requests:', error)
      } else {
        setRequests(data || [])
      }
      setLoading(false)
    }

    fetchRequests()
  }, [memberId])

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4 h-24" />
    )
  }

  if (requests.length === 0) {
    return null // Don't show anything if no pending payments
  }

  if (compact) {
    // Compact view for dashboard widget
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
          <h3 className="text-xs font-medium text-yellow-800">
            Pending Zelle Payment{requests.length > 1 ? 's' : ''}
          </h3>
        </div>
        <div className="space-y-1.5">
          {requests.slice(0, 2).map((req) => (
            <button
              key={req.id}
              onClick={() => router.push(`/pay/${req.reference_code}`)}
              className="w-full flex items-center justify-between p-2 bg-white rounded border border-yellow-200 hover:border-yellow-400 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {formatAmount(req.amount)}
                </p>
                <p className="text-xs text-gray-500">{req.purpose}</p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusColor(req.status)}`}>
                  {getStatusLabel(req.status)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {getTimeRemaining(req.expires_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
        {requests.length > 2 && (
          <button
            onClick={() => router.push('/member/payments?filter=pending')}
            className="mt-1.5 text-xs text-yellow-700 hover:text-yellow-900"
          >
            View all {requests.length} pending →
          </button>
        )}
      </div>
    )
  }

  // Full list view
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Pending Zelle Payments</h3>
      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatAmount(req.amount)}
                </p>
                <p className="text-sm text-gray-600">{req.purpose}</p>
                {req.description && (
                  <p className="text-xs text-gray-500 mt-1">{req.description}</p>
                )}
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                  {getStatusLabel(req.status)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <div className="text-sm text-gray-500">
                <span className="font-mono">{req.reference_code}</span>
                <span className="mx-2">•</span>
                <span>Expires {getTimeRemaining(req.expires_at)}</span>
              </div>
              <button
                onClick={() => router.push(`/pay/${req.reference_code}`)}
                className="px-4 py-1.5 text-sm font-medium text-saffron hover:bg-saffron-soft rounded-md transition-colors"
              >
                {req.status === 'pending' ? 'Complete Payment' : 'View Details'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
