'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ZellePendingPayments } from '@/components/zelle/ZellePendingPayments'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { downloadReceipt, generateReceipt } from '@/lib/pdf/receipt'
import jsPDF from 'jspdf'
import type { PaymentMethod, PaymentPurpose } from '@/types/database'

interface Payment {
  id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  category: PaymentPurpose
  check_number?: string
  transaction_id?: string
  stripe_payment_id?: string
  notes?: string
}

export default function MemberPaymentsPage() {
  const router = useRouter()
  const { member } = useAuth()
  const supabase = createClient()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    if (!member) return
    fetchPayments()
  }, [member, filterYear])

  const fetchPayments = async () => {
    if (!member) return

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', member.id)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = (payment: Payment) => {
    if (!member) return

    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name

    downloadReceipt({
      receiptNumber: `R-${payment.id.slice(0, 8).toUpperCase()}`,
      paymentId: payment.id,
      memberName,
      membershipId: member.membership_id,
      memberEmail: member.primary_email,
      memberAddress: member.address_line1
        ? `${member.address_line1}, ${member.city}, ${member.state} ${member.zip_code}`
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

  // Filter payments by year
  const filteredPayments = payments.filter((payment) => {
    const paymentYear = new Date(payment.payment_date).getFullYear()
    return paymentYear === filterYear
  })

  // Calculate totals
  const totalPaid = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
  const donationsTotal = filteredPayments
    .filter((p) => p.category === 'Donation')
    .reduce((sum, p) => sum + p.amount, 0)

  const getCategoryColor = (category: PaymentPurpose) => {
    switch (category) {
      case 'Membership': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'Donation': return 'text-green-600 bg-green-50 border-green-200'
      case 'Service': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'Event': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'Request': return 'text-indigo-600 bg-indigo-50 border-indigo-200'
      case 'Sponsorship': return 'text-pink-600 bg-pink-50 border-pink-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Export payments to CSV
  const exportToCSV = () => {
    if (!member) return

    const headers = ['Date', 'Category', 'Amount', 'Method', 'Check/Transaction', 'Notes']
    const rows = filteredPayments.map(p => [
      new Date(p.payment_date).toLocaleDateString(),
      p.category,
      `$${p.amount.toFixed(2)}`,
      p.payment_method,
      p.check_number || p.transaction_id || '',
      p.notes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `HSNEF_Payments_${member.membership_id}_${filterYear}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Download all receipts as combined PDF
  const downloadAllReceipts = () => {
    if (!member || filteredPayments.length === 0) return

    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name || ''

    // Combine all receipts into one PDF
    const combinedPdf = new jsPDF()
    let isFirstPage = true

    filteredPayments.forEach((payment, index) => {
      const receiptData = {
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
      }

      const receiptPdf = generateReceipt(receiptData)
      const pdfPages = receiptPdf.internal.getNumberOfPages()

      for (let pageNum = 1; pageNum <= pdfPages; pageNum++) {
        if (!isFirstPage) {
          combinedPdf.addPage()
        }
        isFirstPage = false

        const pageData = receiptPdf.internal.pages[pageNum]
        if (pageData) {
          // Copy page content
          combinedPdf.setPage(combinedPdf.internal.getNumberOfPages())
          const content = receiptPdf.output('arraybuffer')
          // Note: jsPDF doesn't support direct page copy, so we regenerate each receipt separately
        }
      }
    })

    // Alternative approach: Download each receipt separately in a zip-like manner
    // For simplicity, we'll generate a single combined receipt with page breaks
    const finalPdf = new jsPDF()
    let firstPage = true

    filteredPayments.forEach((payment) => {
      if (!firstPage) {
        finalPdf.addPage()
      }
      firstPage = false

      const memberAddr = member.address_line_1
        ? `${member.address_line_1}, ${member.city}, ${member.state} ${member.zip}`
        : undefined

      // Generate receipt content directly on the combined PDF
      finalPdf.setFontSize(20)
      finalPdf.setFont('helvetica', 'bold')
      finalPdf.text('Hindu Society of North East Florida', 105, 20, { align: 'center' })
      finalPdf.setFontSize(10)
      finalPdf.setFont('helvetica', 'normal')
      finalPdf.text('HSNEF Temple | Jacksonville, FL', 105, 28, { align: 'center' })
      finalPdf.setFontSize(16)
      finalPdf.setFont('helvetica', 'bold')
      finalPdf.text('PAYMENT RECEIPT', 105, 45, { align: 'center' })
      finalPdf.setFontSize(10)
      finalPdf.setFont('helvetica', 'normal')
      finalPdf.text(`Receipt #: R-${payment.id.slice(0, 8).toUpperCase()}`, 20, 60)
      finalPdf.text(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, 150, 60)
      finalPdf.line(20, 65, 190, 65)
      finalPdf.text(`Member: ${memberName}`, 20, 75)
      finalPdf.text(`ID: ${member.membership_id}`, 20, 82)
      finalPdf.text(`Category: ${payment.category}`, 20, 95)
      finalPdf.text(`Method: ${payment.payment_method}`, 20, 102)
      finalPdf.setFontSize(14)
      finalPdf.setFont('helvetica', 'bold')
      finalPdf.text(`Amount: $${payment.amount.toFixed(2)}`, 20, 115)
    })

    finalPdf.save(`HSNEF_All_Receipts_${member.membership_id}_${filterYear}.pdf`)
  }

  // Get available years
  const availableYears = Array.from(
    new Set(payments.map((p) => new Date(p.payment_date).getFullYear()))
  ).sort((a, b) => b - a)

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
            <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
            <p className="mt-1 text-sm text-gray-600">
              View your payments and download receipts
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Total Payments ({filterYear})</p>
              <p className="text-3xl font-bold text-gray-900">{filteredPayments.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Total Paid ({filterYear})</p>
              <p className="text-3xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Tax-Deductible Donations</p>
              <p className="text-3xl font-bold text-green-600">${donationsTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Filter and Export Controls */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {availableYears.length > 1 && (
                  <>
                    <label className="text-sm font-medium text-gray-700">Filter by Year:</label>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(parseInt(e.target.value))}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    >
                      {availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>

              {filteredPayments.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>📊</span> Export CSV
                  </button>
                  <button
                    onClick={downloadAllReceipts}
                    className="px-4 py-2 text-sm bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] flex items-center gap-2"
                  >
                    <span>📄</span> Download All Receipts
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pending Zelle Payments */}
          {member && (
            <div className="mb-6">
              <ZellePendingPayments memberId={member.id} />
            </div>
          )}

          {/* Payments List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No payments found for {filterYear}</p>
                <button
                  onClick={() => router.push('/member/donate')}
                  className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E]"
                >
                  Make a Donation
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(payment.category)}`}>
                            {payment.category}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(payment.payment_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <p className="text-2xl font-bold text-gray-900 mb-2">
                          ${payment.amount.toFixed(2)}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Payment Method: {payment.payment_method}</span>
                          {payment.check_number && (
                            <span>Check #{payment.check_number}</span>
                          )}
                          {payment.transaction_id && (
                            <span>TXN: {payment.transaction_id}</span>
                          )}
                        </div>

                        {payment.notes && (
                          <p className="mt-2 text-sm text-gray-500 italic">{payment.notes}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDownloadReceipt(payment)}
                        className="ml-4 px-4 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] text-sm font-medium"
                      >
                        📄 Download Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tax Notice for Donations */}
          {donationsTotal > 0 && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Tax Deductible Donations</h3>
                  <p className="mt-1 text-sm text-green-700">
                    Your donations totaling ${donationsTotal.toFixed(2)} in {filterYear} are tax-deductible.
                    Download receipts for your tax records.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
