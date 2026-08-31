'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

export default function NewRequestPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const [formData, setFormData] = useState({
    request_type: 'Puja',
    service_description: '',
    requested_date: '',
    amount: '',
    status: 'Draft' as 'Draft' | 'Sent',
    notes: '',
    send_invoice: false,
  })

  // Search for member
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, membership_id, first_name, last_name, business_name, member_class, primary_email')
        .or(`membership_id.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,business_name.ilike.%${searchQuery}%,primary_email.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching members:', error)
      alert('Failed to search members')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMember) {
      alert('Please select a member')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      const { data: request, error } = await supabase
        .from('requests')
        .insert({
          member_id: selectedMember.id,
          membership_id: selectedMember.membership_id,
          request_type: formData.request_type,
          service_description: formData.service_description,
          requested_date: formData.requested_date,
          amount: parseFloat(formData.amount),
          status: formData.status,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      // Send invoice email if send_invoice is true
      if (formData.send_invoice && formData.status === 'Sent' && request) {
        try {
          const emailResponse = await fetch('/api/requests/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId: request.id,
              status: 'Sent',
            }),
          })

          if (emailResponse.ok) {
            alert('Request created and invoice email sent successfully!')
          } else {
            alert('Request created but failed to send email notification.')
          }
        } catch (emailError) {
          console.error('Error sending invoice email:', emailError)
          alert('Request created but failed to send email notification.')
        }
      } else {
        alert('Request created successfully!')
      }

      router.push('/admin/requests')
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const getMemberDisplayName = (member: any) => {
    return member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Service Request</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create a new service request or invoice for a member
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/requests')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Requests
            </button>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Member Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Member *
                </label>

                {!selectedMember ? (
                  <>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                        placeholder="Search by name, membership ID, or email..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
                      >
                        Search
                      </button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="border border-gray-200 rounded-md divide-y">
                        {searchResults.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              setSelectedMember(member)
                              setSearchResults([])
                              setSearchQuery('')
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {getMemberDisplayName(member)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {member.membership_id} • {member.primary_email}
                              </p>
                            </div>
                            <span className="text-saffron">Select →</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">
                        {getMemberDisplayName(selectedMember)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedMember.membership_id} • {selectedMember.primary_email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMember(null)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Request Details */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Request Type *
                    </label>
                    <select
                      required
                      value={formData.request_type}
                      onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    >
                      <option value="Puja">Puja</option>
                      <option value="Sponsorship">Sponsorship</option>
                      <option value="Donation Request">Donation Request</option>
                      <option value="Service">Service</option>
                      <option value="Facility Rental">Facility Rental</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requested Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.requested_date}
                      onChange={(e) => setFormData({ ...formData, requested_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.service_description}
                      onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                      placeholder="Describe the service or request in detail..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount * ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    placeholder="Additional notes or special instructions..."
                  />
                </div>
              </div>

              {/* Status and Actions */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Actions</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="Draft"
                        checked={formData.status === 'Draft'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Draft' })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Save as Draft (not sent to member)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="Sent"
                        checked={formData.status === 'Sent'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Sent' })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Mark as Sent
                      </span>
                    </label>
                  </div>

                  {formData.status === 'Sent' && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.send_invoice}
                        onChange={(e) => setFormData({ ...formData, send_invoice: e.target.checked })}
                        className="mr-2 w-4 h-4 text-saffron rounded focus:ring-saffron-ring"
                      />
                      <span className="text-sm text-gray-700">
                        Send invoice email to member
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.push('/admin/requests')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedMember}
                  className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
