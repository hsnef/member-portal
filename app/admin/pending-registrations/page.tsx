'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

interface PendingRegistration {
  id: string
  member_class: string
  requested_level: string
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  nakshatra: string | null
  family_gotra: string | null
  secondary_first_name: string | null
  secondary_last_name: string | null
  secondary_date_of_birth: string | null
  secondary_nakshatra: string | null
  business_name: string | null
  business_ein: string | null
  business_type: string | null
  primary_email: string
  primary_phone: string | null
  secondary_email: string | null
  secondary_phone: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  how_did_you_hear: string | null
  notes: string | null
  status: string
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_member_id: string | null
  assigned_membership_id: string | null
}

export default function PendingRegistrationsPage() {
  const supabase = createClient()
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('Pending')
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(
    null
  )
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [membershipId, setMembershipId] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRegistrations()
  }, [filterStatus])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('pending_member_registrations')
        .select('*')
        .order('submitted_at', { ascending: false })

      if (filterStatus !== 'All') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setRegistrations(data || [])
    } catch (error) {
      console.error('Error fetching registrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRegistration || !membershipId) {
      alert('Please enter a membership ID')
      return
    }

    try {
      setProcessing(true)

      // 1. Create member record - transfer all available fields from pending registration
      const memberInsertData: {
        membership_id: string
        member_class: string
        current_level: string
        first_name: string | null
        last_name: string | null
        primary_email: string
        primary_phone: string | null
        address_line_1: string | null
        address_line_2?: string | null
        city: string | null
        state: string | null
        zip: string | null
        country?: string | null
        nakshatra: string | null
        family_gotra: string | null
        secondary_first_name?: string | null
        secondary_last_name?: string | null
        secondary_email?: string | null
        secondary_phone?: string | null
        secondary_nakshatra?: string | null
        business_name?: string | null
        business_ein?: string | null
      } = {
        membership_id: membershipId,
        member_class: selectedRegistration.member_class,
        current_level: selectedRegistration.requested_level,
        first_name: selectedRegistration.first_name,
        last_name: selectedRegistration.last_name,
        primary_email: selectedRegistration.primary_email,
        primary_phone: selectedRegistration.primary_phone || null,
        address_line_1: selectedRegistration.address_line_1 || null,
        city: selectedRegistration.city || null,
        state: selectedRegistration.state || null,
        zip: selectedRegistration.zip || null,
        nakshatra: selectedRegistration.nakshatra || null,
        family_gotra: selectedRegistration.family_gotra || null,
        secondary_first_name: selectedRegistration.secondary_first_name || null,
        secondary_last_name: selectedRegistration.secondary_last_name || null,
        // Transfer all additional fields that exist in members table
        address_line_2: selectedRegistration.address_line_2 || null,
        secondary_email: selectedRegistration.secondary_email || null,
        secondary_phone: selectedRegistration.secondary_phone || null,
        secondary_nakshatra: selectedRegistration.secondary_nakshatra || null,
        country: selectedRegistration.country || null,
      }

      // Add business-specific fields if business member
      if (selectedRegistration.member_class === 'Business') {
        memberInsertData.business_name = selectedRegistration.business_name
        memberInsertData.business_ein = selectedRegistration.business_ein || null
      }

      const memberResult: { data: { id: string } | null; error: any } = await (supabase
        .from('members')
        .insert(memberInsertData as any)
        .select()
        .single() as any)
      
      const { data: memberData, error: memberError } = memberResult

      if (memberError) {
        console.error('Error creating member:', memberError)
        alert(`Failed to create member: ${memberError.message}`)
        setProcessing(false)
        return
      }

      // 2. Update pending registration status
      const { data: userData } = await supabase.auth.getUser()

      // @ts-ignore - TypeScript type inference issue with pending_member_registrations table
      const { error: updateError } = await supabase
        .from('pending_member_registrations')
        // @ts-ignore - TypeScript type inference issue
        .update({
          status: 'Approved',
          reviewed_by: userData?.user?.id || null,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
          created_member_id: memberData?.id || null,
          assigned_membership_id: membershipId,
        })
        .eq('id', selectedRegistration.id)

      if (updateError) {
        console.error('Error updating registration:', updateError)
        alert('Member created but failed to update registration status')
        setProcessing(false)
        return
      }

      alert(
        `Application approved! Member ${membershipId} created. Send welcome email to ${selectedRegistration.primary_email} with portal registration link.`
      )

      // Reset and refresh
      setShowApprovalModal(false)
      setSelectedRegistration(null)
      setMembershipId('')
      setReviewNotes('')
      fetchRegistrations()
    } catch (error) {
      console.error('Approval error:', error)
      alert('An error occurred during approval')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (registration: PendingRegistration) => {
    const reason = prompt('Enter reason for rejection (will be sent to applicant):')
    if (!reason) return

    try {
      const { data: userData } = await supabase.auth.getUser()

      // @ts-ignore - TypeScript type inference issue with pending_member_registrations table
      const { error } = await supabase
        .from('pending_member_registrations')
        // @ts-ignore - TypeScript type inference issue
        .update({
          status: 'Rejected',
          reviewed_by: userData?.user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reason,
        })
        .eq('id', registration.id)

      if (error) throw error

      alert('Application rejected. Send notification email to applicant.')
      fetchRegistrations()
    } catch (error) {
      console.error('Rejection error:', error)
      alert('Failed to reject application')
    }
  }

  const handleContact = async (registration: PendingRegistration) => {
    const notes = prompt('Enter contact notes:')
    if (!notes) return

    try {
      const { data: userData } = await supabase.auth.getUser()

      // @ts-ignore - TypeScript type inference issue with pending_member_registrations table
      const { error } = await supabase
        .from('pending_member_registrations')
        // @ts-ignore - TypeScript type inference issue
        .update({
          status: 'Contacted',
          reviewed_by: userData?.user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        })
        .eq('id', registration.id)

      if (error) throw error

      alert('Status updated to Contacted')
      fetchRegistrations()
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update status')
    }
  }

  const getNextMembershipId = (level: string) => {
    // Generate next available membership ID based on level
    // This is a simple implementation - you may want more sophisticated logic
    const prefix = level === 'Lifetime' ? '1' : level === 'Annual' ? '2' : '3'
    const random = Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, '0')
    return `${prefix}${random}00`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Contacted':
        return 'bg-blue-100 text-blue-800'
      case 'Approved':
        return 'bg-green-100 text-green-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pending Member Applications</h1>
              <p className="mt-1 text-sm text-gray-600">
                Review and approve membership applications
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
              >
                <option value="All">All Applications</option>
                <option value="Pending">Pending Review</option>
                <option value="Contacted">Contacted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button
                onClick={fetchRegistrations}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Applications List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading applications...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No applications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrations.map((registration) => (
                      <tr key={registration.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(registration.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {registration.member_class === 'Personal'
                            ? `${registration.first_name} ${registration.last_name}`
                            : registration.business_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {registration.primary_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {registration.member_class}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {registration.requested_level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              registration.status
                            )}`}
                          >
                            {registration.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {registration.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRegistration(registration)
                                  setMembershipId(getNextMembershipId(registration.requested_level))
                                  setShowApprovalModal(true)
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleContact(registration)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Contact
                              </button>
                              <button
                                onClick={() => handleReject(registration)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedRegistration(registration)}
                            className="text-saffron hover:text-[#FF8800]"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Details Modal */}
          {selectedRegistration && !showApprovalModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                  <button
                    onClick={() => setSelectedRegistration(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Basic Information</h3>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>{' '}
                        <span className="font-medium">{selectedRegistration.member_class}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Level:</span>{' '}
                        <span className="font-medium">{selectedRegistration.requested_level}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Email:</span>{' '}
                        <span className="font-medium">{selectedRegistration.primary_email}</span>
                      </div>
                      {selectedRegistration.primary_phone && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Phone:</span>{' '}
                          <span className="font-medium">{selectedRegistration.primary_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRegistration.member_class === 'Personal' && (
                    <div>
                      <h3 className="font-semibold text-gray-700">Personal Details</h3>
                      <div className="mt-2 text-sm space-y-1">
                        <p>
                          Name: {selectedRegistration.first_name} {selectedRegistration.last_name}
                        </p>
                        {selectedRegistration.date_of_birth && (
                          <p>Date of Birth: {new Date(selectedRegistration.date_of_birth).toLocaleDateString()}</p>
                        )}
                        {selectedRegistration.nakshatra && (
                          <p>Nakshatra: {selectedRegistration.nakshatra}</p>
                        )}
                        {selectedRegistration.family_gotra && (
                          <p>Gotra: {selectedRegistration.family_gotra}</p>
                        )}
                        {selectedRegistration.secondary_first_name && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="font-medium">Spouse/Partner:</p>
                            <p>
                              Name: {selectedRegistration.secondary_first_name}{' '}
                              {selectedRegistration.secondary_last_name}
                            </p>
                            {selectedRegistration.secondary_date_of_birth && (
                              <p>Date of Birth: {new Date(selectedRegistration.secondary_date_of_birth).toLocaleDateString()}</p>
                            )}
                            {selectedRegistration.secondary_nakshatra && (
                              <p>Nakshatra: {selectedRegistration.secondary_nakshatra}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRegistration.member_class === 'Business' && (
                    <div>
                      <h3 className="font-semibold text-gray-700">Business Details</h3>
                      <div className="mt-2 text-sm space-y-1">
                        <p>Business Name: {selectedRegistration.business_name}</p>
                        {selectedRegistration.business_ein && (
                          <p>EIN (Tax ID): {selectedRegistration.business_ein}</p>
                        )}
                        {selectedRegistration.business_type && (
                          <p>Business Type: {selectedRegistration.business_type}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRegistration.address_line_1 && (
                    <div>
                      <h3 className="font-semibold text-gray-700">Address</h3>
                      <div className="mt-2 text-sm">
                        <p>{selectedRegistration.address_line_1}</p>
                        {selectedRegistration.city && (
                          <p>
                            {selectedRegistration.city}, {selectedRegistration.state}{' '}
                            {selectedRegistration.zip}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRegistration.how_did_you_hear && (
                    <div>
                      <h3 className="font-semibold text-gray-700">How They Heard About Us</h3>
                      <p className="mt-2 text-sm">{selectedRegistration.how_did_you_hear}</p>
                    </div>
                  )}

                  {selectedRegistration.notes && (
                    <div>
                      <h3 className="font-semibold text-gray-700">Additional Notes</h3>
                      <p className="mt-2 text-sm">{selectedRegistration.notes}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedRegistration(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Close
                    </button>
                    {selectedRegistration.status === 'Pending' && (
                      <button
                        onClick={() => {
                          setMembershipId(getNextMembershipId(selectedRegistration.requested_level))
                          setShowApprovalModal(true)
                        }}
                        className="px-4 py-2 bg-saffron text-white rounded-md hover:bg-[#FF8800]"
                      >
                        Approve Application
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval Modal */}
          {showApprovalModal && selectedRegistration && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Approve Application</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Membership ID *
                    </label>
                    <input
                      type="text"
                      value={membershipId}
                      onChange={(e) => setMembershipId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                      placeholder="10000100"
                      disabled={processing}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Format: 8 digits, first digit = level (1=Lifetime, 2=Annual, 3=Community),
                      ends with 00
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes (Optional)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                      disabled={processing}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                    <p className="font-semibold">Next Steps After Approval:</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Member record will be created</li>
                      <li>Send welcome email to: {selectedRegistration.primary_email}</li>
                      <li>Include portal registration link: your-domain.com/register</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-4">
                    <button
                      onClick={() => {
                        setShowApprovalModal(false)
                        setMembershipId('')
                        setReviewNotes('')
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      disabled={processing}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={processing || !membershipId}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Approve & Create Member'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
