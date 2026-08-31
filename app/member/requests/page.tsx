'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { downloadInvoice } from '@/lib/pdf/invoice'

interface Request {
  id: string
  request_type: string
  service_description: string
  requested_date: string
  amount: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Completed' | 'Cancelled'
  payment_id?: string
  notes?: string
  created_at: string
  due_date?: string
}

export default function MemberRequestsPage() {
  const router = useRouter()
  const { member } = useAuth()
  const supabase = createClient()

  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All')

  useEffect(() => {
    if (!member) return
    fetchRequests()
  }, [member])

  const fetchRequests = async () => {
    if (!member) return

    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayRequest = (requestId: string) => {
    router.push(`/member/requests/${requestId}/payment`)
  }

  const handleDownloadInvoice = (request: Request) => {
    if (!member) return

    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name || ''

    downloadInvoice({
      invoiceNumber: `INV-${request.id.slice(0, 8).toUpperCase()}`,
      requestId: request.id,
      memberName,
      membershipId: member.membership_id,
      memberEmail: member.primary_email,
      memberAddress: member.address_line_1
        ? `${member.address_line_1}, ${member.city}, ${member.state} ${member.zip}`
        : undefined,
      requestType: request.request_type,
      serviceDescription: request.service_description,
      requestedDate: request.requested_date,
      amount: request.amount,
      status: request.status,
      notes: request.notes,
      createdDate: request.created_at,
      dueDate: request.due_date,
    })
  }

  const filteredRequests = requests.filter((request) => {
    return filterStatus === 'All' || request.status === filterStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'Sent': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'Paid': return 'text-green-600 bg-green-50 border-green-200'
      case 'Completed': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'Cancelled': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Puja': return '🙏'
      case 'Sponsorship': return '💝'
      case 'Donation Request': return '🙌'
      case 'Service': return '⚙️'
      case 'Facility Rental': return '🏛️'
      default: return '📋'
    }
  }

  // Calculate totals
  const totalAmount = filteredRequests.reduce((sum, r) => sum + r.amount, 0)
  const paidAmount = filteredRequests.filter(r => r.status === 'Paid' || r.status === 'Completed').reduce((sum, r) => sum + r.amount, 0)
  const pendingAmount = filteredRequests.filter(r => r.status === 'Sent').reduce((sum, r) => sum + r.amount, 0)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.push('/member')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Service Requests</h1>
            <p className="mt-1 text-sm text-gray-600">
              View your service requests and invoices
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">{filteredRequests.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Paid Amount</p>
              <p className="text-3xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Pending Payment</p>
              <p className="text-3xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
              >
                <option value="All">All Statuses</option>
                <option value="Sent">Pending Payment</option>
                <option value="Paid">Paid</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No service requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getTypeIcon(request.request_type)}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {request.request_type}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Created {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">
                      {request.service_description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
                      <div>
                        <p className="text-xs text-gray-500">Requested Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(request.requested_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-2xl font-bold text-saffron">
                          ${request.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {request.notes && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs text-blue-700 font-medium mb-1">Notes</p>
                        <p className="text-sm text-blue-900">{request.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {request.status === 'Sent' && (
                        <button
                          onClick={() => handlePayRequest(request.id)}
                          className="flex-1 px-6 py-3 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold"
                        >
                          💳 Pay Now - ${request.amount.toFixed(2)}
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadInvoice(request)}
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        📄 Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
