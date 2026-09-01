'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentsView, type MemberPayment } from '@/components/member/PaymentsView'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { downloadReceipt, generateReceipt } from '@/lib/pdf/receipt'
import jsPDF from 'jspdf'
import type { PaymentMethod, PaymentPurpose } from '@/types/database'

export default function MemberPaymentsPage() {
  const router = useRouter()
  const { member } = useAuth()
  const supabase = createClient()

  const [payments, setPayments] = useState<MemberPayment[]>([])
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

  const handleDownloadReceipt = (payment: MemberPayment) => {
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
      memberAddress: member.address_line_1
        ? `${member.address_line_1}, ${member.city}, ${member.state} ${member.zip}`
        : undefined,
      amount: payment.amount,
      paymentDate: payment.payment_date,
      paymentMethod: payment.method,
      category: payment.purpose,
      checkNumber: payment.check_number,
      transactionId: payment.stripe_payment_intent_id,
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
    .filter((p) => p.purpose === 'Donation')
    .reduce((sum, p) => sum + p.amount, 0)

  const exportToCSV = () => {
    if (!member) return

    const headers = ['Date', 'Category', 'Amount', 'Method', 'Check/Transaction', 'Notes']
    const rows = filteredPayments.map(p => [
      new Date(p.payment_date).toLocaleDateString(),
      p.purpose,
      `$${p.amount.toFixed(2)}`,
      p.method,
      p.check_number || p.stripe_payment_intent_id || '',
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
        paymentMethod: payment.method,
        category: payment.purpose,
        checkNumber: payment.check_number,
        transactionId: payment.stripe_payment_intent_id,
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
      finalPdf.text(`Category: ${payment.purpose}`, 20, 95)
      finalPdf.text(`Method: ${payment.method}`, 20, 102)
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
    <PaymentsView
      memberId={member?.id ?? ''}
      payments={filteredPayments}
      loading={loading}
      year={filterYear}
      availableYears={availableYears}
      onYearChange={setFilterYear}
      totalPaid={totalPaid}
      donationsTotal={donationsTotal}
      onDownloadReceipt={handleDownloadReceipt}
      onExportCsv={exportToCSV}
      onDownloadAllReceipts={downloadAllReceipts}
    />
  )
}
