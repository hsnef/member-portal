import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  doc.text('Hindu Society of North East Florida', 105, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('HSNEF Temple', 105, 28, { align: 'center' })
  doc.text('Jacksonville, FL', 105, 34, { align: 'center' })
  doc.text('Tax ID: XX-XXXXXXX', 105, 40, { align: 'center' })

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
  doc.setFillColor(data.status === 'Paid' ? 34 : data.status === 'Sent' ? 59 : 156,
                   data.status === 'Paid' ? 197 : data.status === 'Sent' ? 130 : 163,
                   data.status === 'Paid' ? 94 : data.status === 'Sent' ? 246 : 175)
  doc.roundedRect(150, 82, 40, 8, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(data.status.toUpperCase(), 170, 88, { align: 'center' })
  doc.setTextColor(0, 0, 0)

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
    headStyles: { fillColor: [255, 153, 51] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
    },
  })

  // Total amount box
  const finalY = (doc as any).lastAutoTable.finalY || itemsY + 50
  doc.setFillColor(255, 153, 51) // Orange color
  doc.rect(130, finalY + 10, 60, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Total Amount', 160, finalY + 18, { align: 'center' })
  doc.setFontSize(18)
  doc.text(`$${data.amount.toFixed(2)}`, 160, finalY + 28, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // Payment instructions
  if (data.status === 'Sent') {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const paymentY = finalY + 45
    doc.text('Payment Instructions:', 20, paymentY)
    doc.setFont('helvetica', 'normal')
    const instructions = [
      '• Pay online through your member portal',
      '• Pay in person at the temple office',
      '• Send check to: HSNEF Temple, Jacksonville, FL',
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
  doc.text('Thank you for your support!', 105, 280, { align: 'center' })
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
