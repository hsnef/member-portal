'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import type { PaymentCategory, PaymentMethod } from '@/types/database'

export default function RecordPaymentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'Cash' as PaymentMethod,
    category: 'Donation' as PaymentCategory,
    check_number: '',
    transaction_id: '',
    notes: '',
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
      const { error } = await supabase
        .from('payments')
        .insert({
          member_id: selectedMember.id,
          amount: parseFloat(formData.amount),
          payment_date: new Date().toISOString(),
          method: formData.payment_method,
          purpose: formData.category,
          check_number: formData.check_number || null,
          zelle_reference: formData.payment_method === 'Zelle' ? formData.transaction_id || null : null,
          stripe_payment_intent_id: formData.payment_method === 'Stripe' ? formData.transaction_id || null : null,
          notes: formData.notes || null,
        })

      if (error) throw error

      alert('Payment recorded successfully!')
      router.push('/admin/payments')
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment')
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
              <h1 className="text-3xl font-bold text-gray-900">Record Payment</h1>
              <p className="mt-1 text-sm text-gray-600">
                Record a cash, check, or card payment
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/payments')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Payments
            </button>
          </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
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

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Stripe">Card/Online (Stripe)</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as PaymentCategory })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                  >
                    <option value="Membership">Membership</option>
                    <option value="Donation">Donation</option>
                    <option value="Service">Service</option>
                    <option value="Event">Event</option>
                    <option value="Sponsorship">Sponsorship</option>
                    <option value="Request">Request</option>
                  </select>
                </div>

                {/* Check Number (conditional) */}
                {formData.payment_method === 'Check' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check Number
                    </label>
                    <input
                      type="text"
                      value={formData.check_number}
                      onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                      placeholder="Check #"
                    />
                  </div>
                )}

                {/* Zelle Reference */}
                {formData.payment_method === 'Zelle' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zelle Reference
                    </label>
                    <input
                      type="text"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                      placeholder="Zelle transaction reference"
                    />
                  </div>
                )}

                {/* Stripe Payment Intent ID */}
                {formData.payment_method === 'Stripe' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stripe Payment Intent ID
                    </label>
                    <input
                      type="text"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                      placeholder="pi_xxxxxxxxxxxxxx"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                  placeholder="Additional notes about this payment..."
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin/payments')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedMember}
                  className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
