'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Request {
  id: string
  member_id: string
  membership_id: string
  request_type: string
  service_description: string
  requested_date: string
  amount: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Completed' | 'Cancelled'
  payment_id?: string
  notes?: string
  created_at: string
  member_name?: string
  member_email?: string
}

export default function RequestsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      // Fetch requests with member details
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          members:member_id (
            first_name,
            last_name,
            business_name,
            member_class,
            primary_email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data
      const transformedRequests = (data || []).map((req: any) => ({
        ...req,
        member_name: req.members?.member_class === 'Personal'
          ? `${req.members.first_name} ${req.members.last_name}`
          : req.members?.business_name || 'Unknown',
        member_email: req.members?.primary_email,
      }))

      setRequests(transformedRequests)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = filterStatus === 'All' || request.status === filterStatus
    const matchesSearch =
      searchQuery === '' ||
      request.membership_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.request_type.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Sent': return 'bg-blue-100 text-blue-800'
      case 'Paid': return 'bg-green-100 text-green-800'
      case 'Completed': return 'bg-purple-100 text-purple-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Puja': return '🙏'
      case 'Sponsorship': return '💝'
      case 'Donation Request': return '🙌'
      case 'Service': return '⚙️'
      case 'Facility Rental': return '🏛️'
      case 'Other': return '📋'
      default: return '📄'
    }
  }

  // Calculate stats
  const totalAmount = filteredRequests.reduce((sum, r) => sum + r.amount, 0)
  const paidAmount = filteredRequests.filter(r => r.status === 'Paid' || r.status === 'Completed').reduce((sum, r) => sum + r.amount, 0)
  const pendingAmount = filteredRequests.filter(r => r.status === 'Sent').reduce((sum, r) => sum + r.amount, 0)

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Requests & Invoices</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage service requests and invoices
            </p>
          </div>
          <Link
            href="/admin/requests/new"
            className="px-4 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-medium"
          >
            + Create Request
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">{filteredRequests.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Paid Amount</p>
            <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pending Payment</p>
            <p className="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by member, type, or membership ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
            />

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No requests found</p>
              <Link
                href="/admin/requests/new"
                className="inline-block px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
              >
                Create First Request
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-transparent">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(request.request_type)}</span>
                        <h3 className="text-lg font-bold text-gray-900">
                          {request.request_type}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        {request.service_description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium text-gray-700">Member:</span>{' '}
                          <span className="text-gray-600">{request.member_name}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">ID:</span>{' '}
                          <span className="text-gray-600">{request.membership_id}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Requested:</span>{' '}
                          <span className="text-gray-600">
                            {new Date(request.requested_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Amount:</span>{' '}
                          <span className="font-bold text-saffron">
                            ${request.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {request.notes && (
                        <p className="text-sm text-gray-500 italic">Note: {request.notes}</p>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col gap-2">
                      <button
                        onClick={() => router.push(`/admin/requests/${request.id}`)}
                        className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-transparent"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => router.push(`/admin/requests/${request.id}/edit`)}
                        className="px-4 py-2 text-sm bg-saffron text-white rounded-md hover:bg-saffron-hover"
                      >
                        Edit
                      </button>
                      {request.status === 'Sent' && (
                        <button
                          onClick={() => alert('Record payment for this request')}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Record Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
