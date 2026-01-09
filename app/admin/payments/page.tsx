'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import type { PaymentCategory, PaymentMethod } from '@/types/database'
import { useTestData } from '@/lib/context/TestDataContext'
import { getTestMemberIds } from '@/lib/utils/testDataFiltering'

interface Payment {
  id: string
  member_id: string
  membership_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  category: PaymentCategory
  check_number?: string
  transaction_id?: string
  stripe_payment_id?: string
  notes?: string
  member_name?: string
  member_email?: string
  is_test_payment?: boolean
}

export default function PaymentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showTestData } = useTestData()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<PaymentCategory | 'All'>('All')
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'All'>('All')

  useEffect(() => {
    fetchPayments()
  }, [showTestData])

  const fetchPayments = async () => {
    try {
      // Get test member IDs for filtering
      const testMemberIds = await getTestMemberIds()

      // Fetch payments with member details
      let query = supabase
        .from('payments')
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
        .order('payment_date', { ascending: false })
        .limit(100)

      // Filter out test payments unless showTestData toggle is ON
      if (!showTestData && testMemberIds.length > 0) {
        query = query.not('member_id', 'in', `(${testMemberIds.join(',')})`)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data to include member name and test flag
      const transformedPayments = data?.map((payment: any) => ({
        ...payment,
        member_name: payment.members?.member_class === 'Personal'
          ? `${payment.members.first_name} ${payment.members.last_name}`
          : payment.members?.business_name || 'Unknown',
        member_email: payment.members?.primary_email,
        is_test_payment: testMemberIds.includes(payment.member_id),
      })) || []

      setPayments(transformedPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      searchQuery === '' ||
      payment.membership_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.member_email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = filterCategory === 'All' || payment.category === filterCategory
    const matchesMethod = filterMethod === 'All' || payment.payment_method === filterMethod

    return matchesSearch && matchesCategory && matchesMethod
  })

  // Calculate totals
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)

  const getCategoryBadgeColor = (category: PaymentCategory) => {
    switch (category) {
      case 'Membership': return 'bg-blue-100 text-blue-800'
      case 'Donation': return 'bg-green-100 text-green-800'
      case 'Service': return 'bg-purple-100 text-purple-800'
      case 'Event': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodBadgeColor = (method: PaymentMethod) => {
    switch (method) {
      case 'Cash': return 'bg-yellow-100 text-yellow-800'
      case 'Check': return 'bg-indigo-100 text-indigo-800'
      case 'Card': return 'bg-pink-100 text-pink-800'
      case 'Online': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and view all payment records
              </p>
            </div>
            <Link
              href="/admin/payments/new"
              className="px-4 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] font-medium"
            >
              + Record Payment
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Membership Payments</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredPayments.filter(p => p.category === 'Membership').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Donations</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredPayments.filter(p => p.category === 'Donation').length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search by member name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                >
                  <option value="All">All Categories</option>
                  <option value="Membership">Membership</option>
                  <option value="Donation">Donation</option>
                  <option value="Service">Service</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Method Filter */}
              <div>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                >
                  <option value="All">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.member_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.membership_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(payment.category)}`}>
                              {payment.category}
                            </span>
                            {payment.is_test_payment && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                🧪 TEST
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMethodBadgeColor(payment.payment_method)}`}>
                            {payment.payment_method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.check_number && `Check #${payment.check_number}`}
                          {payment.transaction_id && `TXN: ${payment.transaction_id}`}
                          {payment.stripe_payment_id && `Stripe: ${payment.stripe_payment_id.slice(0, 12)}...`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/admin/payments/${payment.id}`)}
                            className="text-[#FF9933] hover:text-[#E68A2E] mr-4"
                          >
                            View
                          </button>
                          <button
                            onClick={() => alert('Receipt generation coming soon')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
