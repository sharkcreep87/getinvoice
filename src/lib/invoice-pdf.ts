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
  currency?: string
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

type CompanyInfo = {
  name?: string
  email?: string
  company_name?: string
  company_email?: string
  company_phone?: string
  company_address?: string
  company_city?: string
  company_state?: string
  company_zip?: string
  company_country?: string
  company_logo_url?: string
  tax_id?: string
  invoice_terms?: string
  invoice_footer?: string
}

export function generateInvoicePDF(invoice: InvoiceData, companyInfo: CompanyInfo, currency?: string) {
  const invoiceCurrency = currency || invoice.currency || 'MYR'
  const doc = new jsPDF()

  // Add company logo if available
  let logoHeight = 0
  if (companyInfo.company_logo_url) {
    try {
      // Note: In a real implementation, you'd need to load the image properly
      // This is a placeholder for the logo functionality
      logoHeight = 20
    } catch (error) {
      console.error('Failed to load logo:', error)
    }
  }

  // Header with magenta theme
  doc.setFontSize(28)
  doc.setTextColor(219, 39, 119) // Magenta color
  doc.text('INVOICE', 20, 25)

  // Add decorative line
  doc.setDrawColor(219, 39, 119)
  doc.setLineWidth(0.5)
  doc.line(20, 28, 80, 28)

  // Company Info
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(companyInfo.company_name || companyInfo.name || 'Your Company', 20, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  let companyY = 43
  if (companyInfo.company_email) {
    doc.text(companyInfo.company_email, 20, companyY)
    companyY += 4
  }
  if (companyInfo.company_phone) {
    doc.text(companyInfo.company_phone, 20, companyY)
    companyY += 4
  }
  if (companyInfo.company_address) {
    doc.text(companyInfo.company_address, 20, companyY)
    companyY += 4
    const cityStateZip = [
      companyInfo.company_city,
      companyInfo.company_state,
      companyInfo.company_zip,
    ].filter(Boolean).join(', ')
    if (cityStateZip) {
      doc.text(cityStateZip, 20, companyY)
      companyY += 4
    }
    if (companyInfo.company_country) {
      doc.text(companyInfo.company_country, 20, companyY)
    }
  }
  if (companyInfo.tax_id) {
    doc.text(`Tax ID: ${companyInfo.tax_id}`, 20, companyY + 4)
  }

  // Invoice Details
  doc.setFontSize(10)
  doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 20)
  doc.text(`Issue Date: ${formatDate(invoice.issue_date)}`, 140, 25)
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 140, 30)

  // Status badge
  const statusColors: any = {
    draft: [156, 163, 175],
    sent: [219, 39, 119], // Magenta for sent
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
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 20, 50)
  doc.setFont('helvetica', 'normal')
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
    formatCurrency(item.unit_price, invoiceCurrency),
    formatCurrency(item.amount, invoiceCurrency),
  ])

  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Quantity', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [219, 39, 119], // Magenta theme
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
  doc.text(formatCurrency(invoice.subtotal, invoiceCurrency), 180, finalY, { align: 'right' })

  if (invoice.discount_amount > 0) {
    doc.text('Discount:', totalsX, finalY + 6)
    doc.text(`-${formatCurrency(invoice.discount_amount, invoiceCurrency)}`, 180, finalY + 6, {
      align: 'right',
    })
  }

  doc.text(`Tax (${invoice.tax_rate}%):`, totalsX, finalY + 12)
  doc.text(formatCurrency(invoice.tax_amount, invoiceCurrency), 180, finalY + 12, {
    align: 'right',
  })

  // Total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Total:', totalsX, finalY + 20)
  doc.text(formatCurrency(invoice.total, invoiceCurrency), 180, finalY + 20, { align: 'right' })

  // Notes and Terms
  let currentY = finalY + 35
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Notes:', 20, currentY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const splitNotes = doc.splitTextToSize(invoice.notes, 170)
    doc.text(splitNotes, 20, currentY + 5)
    currentY += 5 + splitNotes.length * 4 + 5
  }

  // Use company invoice terms if available, otherwise use invoice-specific terms
  const termsToUse = companyInfo.invoice_terms || invoice.terms
  if (termsToUse) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Terms & Conditions:', 20, currentY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const splitTerms = doc.splitTextToSize(termsToUse, 170)
    doc.text(splitTerms, 20, currentY + 5)
    currentY += 5 + splitTerms.length * 4 + 5
  }

  // Footer
  if (companyInfo.invoice_footer) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    const splitFooter = doc.splitTextToSize(companyInfo.invoice_footer, 170)
    doc.text(splitFooter, 20, currentY)
  }

  return doc
}
