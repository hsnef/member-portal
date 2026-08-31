'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatAmount, getTimeRemaining, getStatusLabel, getStatusColor } from '@/lib/zelle'

interface ZelleRequestWithMember {
  id: string
  reference_code: string
  amount: number
  purpose: string
  description: string | null
  status: string
  member_confirmed_at: string | null
  member_zelle_reference: string | null
  expires_at: string
  created_at: string
  members?: {
    id: string
    membership_id: string
    first_name: string | null
    last_name: string | null
    business_name: string | null
    member_class: string
    primary_email: string
  } | null
}

export default function ZelleAdminPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ZelleRequestWithMember[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'member_confirmed'>('all')

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/zelle/pending')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch requests')
        return
      }

      setRequests(data.requests || [])
    } catch {
      setError('Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    // Refresh every 30 seconds
    const interval = setInterval(fetchRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleConfirm = async (reference: string) => {
    setConfirming(reference)

    try {
      const response = await fetch('/api/zelle/staff-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to confirm payment')
        return
      }

      // Remove from list
      setRequests(prev => prev.filter(r => r.reference_code !== reference))
      alert('Payment confirmed successfully!')
    } catch {
      alert('Failed to confirm payment')
    } finally {
      setConfirming(null)
    }
  }

  const getMemberName = (member: ZelleRequestWithMember['members']) => {
    if (!member) return 'Walk-in'
    return member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true
    return req.status === filter
  })

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const awaitingConfirmCount = requests.filter(r => r.status === 'member_confirmed').length

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zelle Payments</h1>
            <p className="mt-1 text-sm text-gray-600">
              Review and confirm pending Zelle payments
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/admin/zelle/quick-pay')}
              className="px-4 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Quick Pay QR
            </button>
            <button
              onClick={() => router.push('/admin/zelle/settings')}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-transparent flex items-center gap-2"
              title="Zelle Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400">
            <p className="text-sm text-gray-500">Awaiting Payment</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-400">
            <p className="text-sm text-gray-500">Ready to Confirm</p>
            <p className="text-2xl font-bold text-blue-600">{awaitingConfirmCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
            <p className="text-sm text-gray-500">Total Active</p>
            <p className="text-2xl font-bold text-gray-600">{requests.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-transparent'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilter('member_confirmed')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'member_confirmed'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-transparent'
            }`}
          >
            Ready to Confirm ({awaitingConfirmCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-transparent'
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payments...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Payments</h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'There are no active Zelle payment requests.'
                : `No payments with "${filter.replace('_', ' ')}" status.`}
            </p>
          </div>
        )}

        {/* Requests List */}
        {!loading && filteredRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-transparent">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-transparent">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getMemberName(req.members)}
                        </p>
                        {req.members && (
                          <p className="text-xs text-gray-500">{req.members.membership_id}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-mono font-medium text-gray-900">
                          {req.reference_code}
                        </p>
                        {req.member_zelle_reference && (
                          <p className="text-xs text-gray-500">
                            Bank ref: {req.member_zelle_reference}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatAmount(req.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{req.purpose}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(req.status as any)}`}>
                        {getStatusLabel(req.status as any)}
                      </span>
                      {req.member_confirmed_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(req.member_confirmed_at).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTimeRemaining(req.expires_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        {req.status === 'member_confirmed' && (
                          <button
                            onClick={() => handleConfirm(req.reference_code)}
                            disabled={confirming === req.reference_code}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-xs font-medium"
                          >
                            {confirming === req.reference_code ? 'Confirming...' : 'Confirm'}
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/pay/${req.reference_code}`)}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-transparent text-xs"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
