import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PDF } from './theme'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

interface InvoiceData {
  invoiceNumber: string
  requestId: string
  memberName: string
  membershipId: string
  memberEmail: string
  memberAddress?: string
  requestType: string
  serviceDescription: string
  requestedDate: string
  amount: number
  status: string
  notes?: string
  createdDate: string
  dueDate?: string
}

/**
 * Generate a PDF invoice for a service request
 */
export function generateInvoice(data: InvoiceData): jsPDF {
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

  // Invoice title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 105, 55, { align: 'center' })

  // Invoice details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice #: ${data.invoiceNumber}`, 20, 70)
  doc.text(`Date: ${new Date(data.createdDate).toLocaleDateString()}`, 150, 70)

  if (data.dueDate) {
    doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, 150, 76)
  }

  // Status badge
  const statusColor =
    data.status === 'Paid'
      ? PDF.success
      : data.status === 'Sent'
        ? PDF.warning
        : PDF.neutral
  doc.setFillColor(...statusColor)
  doc.roundedRect(150, 82, 40, 8, 2, 2, 'F')
  doc.setTextColor(...PDF.white)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(data.status.toUpperCase(), 170, 88, { align: 'center' })
  doc.setTextColor(...PDF.ink)

  // Horizontal line
  doc.line(20, 95, 190, 95)

  // Bill To section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 20, 105)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(data.memberName, 20, 113)
  doc.text(`Membership ID: ${data.membershipId}`, 20, 120)
  doc.text(data.memberEmail, 20, 127)
  if (data.memberAddress) {
    doc.text(data.memberAddress, 20, 134)
  }

  // Service Details section
  const detailsY = data.memberAddress ? 148 : 141
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Service Details', 20, detailsY)

  const serviceDetails: string[][] = [
    ['Service Type', data.requestType],
    ['Requested Date', new Date(data.requestedDate).toLocaleDateString()],
    ['Description', data.serviceDescription],
  ]

  autoTable(doc, {
    startY: detailsY + 5,
    head: [['Item', 'Details']],
    body: serviceDetails,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' },
    },
  })

  // Invoice Items table
  const itemsY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Invoice Items', 20, itemsY)

  autoTable(doc, {
    startY: itemsY + 5,
    head: [['Description', 'Amount']],
    body: [
      [data.requestType + ' - ' + data.serviceDescription.substring(0, 50), `$${data.amount.toFixed(2)}`]
    ],
    theme: 'striped',
    headStyles: { fillColor: [...PDF.kumkum], textColor: [...PDF.white] },
    alternateRowStyles: { fillColor: [...PDF.surfaceSunk] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
    },
  })

  // Total amount box
  const finalY = (doc as any).lastAutoTable.finalY || itemsY + 50
  doc.setFillColor(...PDF.kumkum) // white text on this passes AA
  doc.rect(130, finalY + 10, 60, 25, 'F')
  doc.setTextColor(...PDF.white)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Total Amount', 160, finalY + 18, { align: 'center' })
  doc.setFontSize(18)
  doc.text(`$${data.amount.toFixed(2)}`, 160, finalY + 28, { align: 'center' })
  doc.setTextColor(...PDF.ink)

  // Payment instructions
  if (data.status === 'Sent') {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const paymentY = finalY + 45
    doc.text('Payment Instructions:', 20, paymentY)
    doc.setFont('helvetica', 'normal')
    const instructions = [
      `• Pay online at ${TEMPLE_CONFIG.contact.memberPortal}`,
      '• Pay in person at the temple office',
      `• Send check to: ${TEMPLE_CONFIG.address.full}`,
    ]
    instructions.forEach((instruction, index) => {
      doc.text(instruction, 20, paymentY + 6 + (index * 6))
    })
  }

  // Notes
  if (data.notes) {
    const notesY = data.status === 'Sent' ? finalY + 70 : finalY + 45
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
  doc.text('For questions about this invoice, please contact the temple office.', 105, 285, { align: 'center' })

  return doc
}

/**
 * Download an invoice as PDF
 */
export function downloadInvoice(data: InvoiceData) {
  const doc = generateInvoice(data)
  const filename = `HSNEF_Invoice_${data.invoiceNumber}_${data.membershipId}.pdf`
  doc.save(filename)
}

/**
 * Get invoice as blob for email attachment
 */
export function getInvoiceBlob(data: InvoiceData): Blob {
  const doc = generateInvoice(data)
  return doc.output('blob')
}
