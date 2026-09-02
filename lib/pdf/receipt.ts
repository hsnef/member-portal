import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PDF } from './theme'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

interface ReceiptData {
  receiptNumber: string
  paymentId: string
  memberName: string
  membershipId: string
  memberEmail: string
  memberAddress?: string
  amount: number
  paymentDate: string
  paymentMethod: string
  category: string
  purpose?: string
  checkNumber?: string
  transactionId?: string
  notes?: string
}

/**
 * Generate a PDF receipt for a payment
 */
export function generateReceipt(data: ReceiptData): jsPDF {
  const doc = new jsPDF()

  // Add temple logo/header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(TEMPLE_CONFIG.name, 105, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(TEMPLE_CONFIG.shortName + ' Temple', 105, 28, { align: 'center' })
  doc.text(`${TEMPLE_CONFIG.address.city}, ${TEMPLE_CONFIG.address.state}`, 105, 34, { align: 'center' })
  doc.text(`Tax ID: ${TEMPLE_CONFIG.taxId}`, 105, 40, { align: 'center' })

  // Receipt title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT RECEIPT', 105, 55, { align: 'center' })

  // Receipt number and date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Receipt #: ${data.receiptNumber}`, 20, 70)
  doc.text(`Date: ${new Date(data.paymentDate).toLocaleDateString()}`, 150, 70)

  // Horizontal line
  doc.line(20, 75, 190, 75)

  // Member information section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Member Information', 20, 85)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${data.memberName}`, 20, 93)
  doc.text(`Membership ID: ${data.membershipId}`, 20, 100)
  doc.text(`Email: ${data.memberEmail}`, 20, 107)
  if (data.memberAddress) {
    doc.text(`Address: ${data.memberAddress}`, 20, 114)
  }

  // Payment details section
  const detailsY = data.memberAddress ? 128 : 121
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Details', 20, detailsY)

  const paymentDetails: string[][] = [
    ['Category', data.category],
    ['Amount', `$${data.amount.toFixed(2)}`],
    ['Payment Method', data.paymentMethod],
  ]

  if (data.purpose) {
    paymentDetails.push(['Purpose', data.purpose])
  }

  if (data.checkNumber) {
    paymentDetails.push(['Check Number', data.checkNumber])
  }

  if (data.transactionId) {
    paymentDetails.push(['Transaction ID', data.transactionId])
  }

  autoTable(doc, {
    startY: detailsY + 5,
    head: [['Description', 'Details']],
    body: paymentDetails,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
  })

  // Amount summary box
  const finalY = (doc as any).lastAutoTable.finalY || detailsY + 50
  doc.setFillColor(...PDF.kumkum) // white text on this passes AA
  doc.rect(130, finalY + 10, 60, 25, 'F')
  doc.setTextColor(...PDF.white)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Total Amount', 160, finalY + 18, { align: 'center' })
  doc.setFontSize(16)
  doc.text(`$${data.amount.toFixed(2)}`, 160, finalY + 28, { align: 'center' })
  doc.setTextColor(...PDF.ink)

  // Tax deductible notice (for donations)
  if (data.category === 'Donation') {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    const noticeY = finalY + 45
    doc.text(TEMPLE_CONFIG.messaging.taxDeductible.split('.')[0] + '.', 105, noticeY, { align: 'center' })
    doc.text('Please retain this receipt for your tax records.', 105, noticeY + 6, { align: 'center' })
  }

  // Notes
  if (data.notes) {
    const notesY = data.category === 'Donation' ? finalY + 60 : finalY + 45
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', 20, notesY)
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(data.notes, 170)
    doc.text(splitNotes, 20, notesY + 6)
  }

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(TEMPLE_CONFIG.messaging.thankYou, 105, 280, { align: 'center' })
  doc.text(TEMPLE_CONFIG.messaging.contactFooter, 105, 285, { align: 'center' })

  return doc
}

/**
 * Download a receipt as PDF
 */
export function downloadReceipt(data: ReceiptData) {
  const doc = generateReceipt(data)
  const filename = `HSNEF_Receipt_${data.receiptNumber}_${data.membershipId}.pdf`
  doc.save(filename)
}

/**
 * Get receipt as blob for email attachment
 */
export function getReceiptBlob(data: ReceiptData): Blob {
  const doc = generateReceipt(data)
  return doc.output('blob')
}
