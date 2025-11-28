import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from './utils'

type InvoiceData = {
  invoice_number: string
  issue_date: string
  due_date: string
  status: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total: number
  notes: string | null
  terms: string | null
  customer: {
    name: string
    email: string
    company: string | null
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    country: string | null
  }
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    amount: number
  }>
}

export function generateInvoicePDF(invoice: InvoiceData, companyInfo: any) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(24)
  doc.setTextColor(59, 130, 246)
  doc.text('INVOICE', 20, 20)

  // Company Info
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(companyInfo.name || 'Your Company', 20, 30)
  if (companyInfo.email) doc.text(companyInfo.email, 20, 35)

  // Invoice Details
  doc.setFontSize(10)
  doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 20)
  doc.text(`Issue Date: ${formatDate(invoice.issue_date)}`, 140, 25)
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 140, 30)

  // Status badge
  const statusColors: any = {
    draft: [156, 163, 175],
    sent: [59, 130, 246],
    paid: [34, 197, 94],
    overdue: [239, 68, 68],
    cancelled: [107, 114, 128],
  }
  const color = statusColors[invoice.status] || [156, 163, 175]
  doc.setFillColor(color[0], color[1], color[2])
  doc.setTextColor(255, 255, 255)
  doc.roundedRect(140, 33, 30, 6, 2, 2, 'F')
  doc.text(invoice.status.toUpperCase(), 142, 37)
  doc.setTextColor(0, 0, 0)

  // Bill To
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('Bill To:', 20, 50)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  doc.text(invoice.customer.name, 20, 56)
  if (invoice.customer.company) doc.text(invoice.customer.company, 20, 61)
  if (invoice.customer.email) doc.text(invoice.customer.email, 20, 66)
  if (invoice.customer.address) {
    doc.text(invoice.customer.address, 20, 71)
    const cityStateZip = [
      invoice.customer.city,
      invoice.customer.state,
      invoice.customer.zip,
    ]
      .filter(Boolean)
      .join(', ')
    if (cityStateZip) doc.text(cityStateZip, 20, 76)
    if (invoice.customer.country) doc.text(invoice.customer.country, 20, 81)
  }

  // Items Table
  const tableStartY = 95
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.amount),
  ])

  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Quantity', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  })

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10
  const totalsX = 130

  doc.setFontSize(10)
  doc.text('Subtotal:', totalsX, finalY)
  doc.text(formatCurrency(invoice.subtotal), 180, finalY, { align: 'right' })

  if (invoice.discount_amount > 0) {
    doc.text('Discount:', totalsX, finalY + 6)
    doc.text(`-${formatCurrency(invoice.discount_amount)}`, 180, finalY + 6, {
      align: 'right',
    })
  }

  doc.text(`Tax (${invoice.tax_rate}%):`, totalsX, finalY + 12)
  doc.text(formatCurrency(invoice.tax_amount), 180, finalY + 12, {
    align: 'right',
  })

  // Total
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.text('Total:', totalsX, finalY + 20)
  doc.text(formatCurrency(invoice.total), 180, finalY + 20, { align: 'right' })

  // Notes and Terms
  let currentY = finalY + 35
  if (invoice.notes) {
    doc.setFont(undefined, 'bold')
    doc.setFontSize(10)
    doc.text('Notes:', 20, currentY)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    const splitNotes = doc.splitTextToSize(invoice.notes, 170)
    doc.text(splitNotes, 20, currentY + 5)
    currentY += 5 + splitNotes.length * 4 + 5
  }

  if (invoice.terms) {
    doc.setFont(undefined, 'bold')
    doc.setFontSize(10)
    doc.text('Terms & Conditions:', 20, currentY)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    const splitTerms = doc.splitTextToSize(invoice.terms, 170)
    doc.text(splitTerms, 20, currentY + 5)
  }

  return doc
}
