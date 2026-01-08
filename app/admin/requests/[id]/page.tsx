'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { downloadInvoice } from '@/lib/pdf/invoice'

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
}

interface Member {
  first_name: string
  last_name: string
  business_name: string
  member_class: string
  primary_email: string
  primary_phone?: string
  address_line_1?: string
  city?: string
  state?: string
  zip?: string
}

export default function ViewRequestPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  const supabase = createClient()

  const [request, setRequest] = useState<Request | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (requestId) {
      fetchRequest()
    }
  }, [requestId])

  const fetchRequest = async () => {
    try {
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (requestError) throw requestError
      setRequest(requestData)

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', requestData.member_id)
        .single()

      if (memberError) throw memberError
      setMember(memberData)
    } catch (error) {
      console.error('Error fetching request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!request) return
    if (!confirm(`Change status to ${newStatus}?`)) return

    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', request.id)

      if (error) throw error

      alert('Status updated successfully!')
      fetchRequest()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleDownloadInvoice = () => {
    if (!request || !member) return

    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name

    downloadInvoice({
      invoiceNumber: `INV-${request.id.slice(0, 8).toUpperCase()}`,
      requestId: request.id,
      memberName,
      membershipId: request.membership_id,
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
      dueDate: request.requested_date,
    })
  }

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

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
        <AdminLayout>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading request...</p>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (!request || !member) {
    return (
      <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
        <AdminLayout>
          <div className="text-center py-12">
            <p className="text-gray-500">Request not found</p>
            <button
              onClick={() => router.push('/admin/requests')}
              className="mt-4 px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E]"
            >
              Back to Requests
            </button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  const memberName = member.member_class === 'Personal'
    ? `${member.first_name} ${member.last_name}`
    : member.business_name

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/admin/requests')}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Back to Requests
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
              <p className="mt-1 text-sm text-gray-600">
                Invoice #{request.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/admin/requests/${request.id}/edit`)}
                className="px-4 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E]"
              >
                Edit Request
              </button>
              <button
                onClick={handleDownloadInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                📄 Download Invoice
              </button>
            </div>
          </div>

          {/* Request Overview */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Request Information</h2>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
                {request.status}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Request Type</p>
                  <p className="text-lg font-semibold text-gray-900">{request.request_type}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-[#FF9933]">${request.amount.toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Requested Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(request.requested_date).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Created</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Service Description */}
              <div className="border-t pt-6">
                <p className="text-sm text-gray-500 mb-2">Service Description</p>
                <p className="text-gray-900">{request.service_description}</p>
              </div>

              {/* Notes */}
              {request.notes && (
                <div className="border-t pt-6">
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-gray-900">{request.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Member Information */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Member Information</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Member Name</p>
                  <p className="text-lg font-semibold text-gray-900">{memberName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Membership ID</p>
                  <p className="text-lg font-mono font-semibold text-[#FF9933]">
                    {request.membership_id}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="text-gray-900">{member.primary_email}</p>
                </div>

                {member.primary_phone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="text-gray-900">{member.primary_phone}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => router.push(`/admin/members/${request.member_id}`)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                >
                  View Member Profile
                </button>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Update Status</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['Draft', 'Sent', 'Paid', 'Completed', 'Cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={request.status === status}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      request.status === status
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {request.status === 'Sent' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Tip:</strong> When payment is received, update status to "Paid" or record the payment directly from the payments section.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
