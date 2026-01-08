'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { downloadReceipt } from '@/lib/pdf/receipt'
import type { PaymentCategory, PaymentMethod } from '@/types/database'

interface Payment {
  id: string
  member_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  category: PaymentCategory
  check_number?: string
  transaction_id?: string
  stripe_payment_id?: string
  notes?: string
  members: {
    membership_id: string
    first_name: string
    last_name: string
    business_name?: string
    member_class: string
    primary_email?: string
    address_line_1?: string
    city?: string
    state?: string
    zip?: string
    is_test_account: boolean
  }
}

export default function AdminReceiptsPage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [filterCategory, setFilterCategory] = useState<'all' | PaymentCategory>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [includeTestAccounts, setIncludeTestAccounts] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [filterYear, filterCategory, includeTestAccounts])

  const fetchPayments = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('payments')
        .select(`
          *,
          members (
            membership_id,
            first_name,
            last_name,
            business_name,
            member_class,
            primary_email,
            address_line_1,
            city,
            state,
            zip,
            is_test_account
          )
        `)
        .order('payment_date', { ascending: false })

      // Filter by year
      const startDate = `${filterYear}-01-01`
      const endDate = `${filterYear}-12-31`
      query = query.gte('payment_date', startDate).lte('payment_date', endDate)

      // Filter by category
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter out test accounts unless explicitly included
      let filteredData = data || []
      if (!includeTestAccounts) {
        filteredData = filteredData.filter(p => !p.members?.is_test_account)
      }

      setPayments(filteredData)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = (payment: Payment) => {
    const member = payment.members
    if (!member) return

    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name || `${member.first_name} ${member.last_name}`

    downloadReceipt({
      receiptNumber: `R-${payment.id.slice(0, 8).toUpperCase()}`,
      paymentId: payment.id,
      memberName,
      membershipId: member.membership_id,
      memberEmail: member.primary_email,
      memberAddress: member.address_line_1
        ? `${member.address_line_1}, ${member.city}, ${member.state} ${member.zip}`
        : undefined,
      amount: payment.amount,
      paymentDate: payment.payment_date,
      paymentMethod: payment.payment_method,
      category: payment.category,
      checkNumber: payment.check_number,
      transactionId: payment.transaction_id,
      notes: payment.notes,
    })
  }

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      payment.members?.membership_id.toLowerCase().includes(search) ||
      payment.members?.first_name.toLowerCase().includes(search) ||
      payment.members?.last_name.toLowerCase().includes(search) ||
      payment.members?.business_name?.toLowerCase().includes(search) ||
      payment.id.toLowerCase().includes(search)
    )
  })

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)

  const getCategoryColor = (category: PaymentCategory) => {
    switch (category) {
      case 'Membership': return 'bg-blue-100 text-blue-800'
      case 'Donation': return 'bg-green-100 text-green-800'
      case 'Service': return 'bg-purple-100 text-purple-800'
      case 'Event': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and download payment receipts
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="space-y-4">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search by member name, number, or receipt ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-4">
                {/* Year Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                  >
                    <option value="all">All Categories</option>
                    <option value="Membership">Membership</option>
                    <option value="Donation">Donation</option>
                    <option value="Service">Service</option>
                    <option value="Event">Event</option>
                  </select>
                </div>

                {/* Test Accounts Toggle */}
                <div className="flex items-end">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTestAccounts}
                      onChange={(e) => setIncludeTestAccounts(e.target.checked)}
                      className="h-4 w-4 text-[#FF9933] focus:ring-[#FF9933] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include test accounts</span>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {filteredPayments.length} receipts
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  Total: ${totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Receipts List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading receipts...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No receipts found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search or filters' : 'No receipts for the selected period'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            R-{payment.id.slice(0, 8).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {payment.members?.member_class === 'Personal'
                                ? `${payment.members.first_name} ${payment.members.last_name}`
                                : payment.members?.business_name}
                              {payment.members?.is_test_account && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                                  TEST
                                </span>
                              )}
                            </div>
                            <div className="text-gray-500">{payment.members?.membership_id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(payment.category)}`}>
                            {payment.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDownloadReceipt(payment)}
                            className="text-[#FF9933] hover:text-[#E68A2E]"
                          >
                            Download PDF
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
