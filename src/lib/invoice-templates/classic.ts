import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from '../utils'

// Helper function to load image as data URL and return natural dimensions
async function loadImageAsDataURL(url: string): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.width, height: img.height })
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

export type InvoiceData = {
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

export type CompanyInfo = {
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

export async function generateClassicTemplate(
  invoice: InvoiceData,
  companyInfo: CompanyInfo,
  currency?: string
): Promise<jsPDF> {
  const invoiceCurrency = currency || invoice.currency || 'MYR'
  const doc = new jsPDF()

  // Set white background
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Reset colors
  doc.setDrawColor(0, 0, 0)
  doc.setTextColor(0, 0, 0)

  // Add company logo if available
  let logoHeight = 0
  let contentStartY = 20

  if (companyInfo.company_logo_url) {
    try {
      const logo = await loadImageAsDataURL(companyInfo.company_logo_url)
      const maxLogoWidth = 30
      const maxLogoHeight = 15
      const logoX = 20
      const logoY = 15

      const imgW = logo.width
      const imgH = logo.height

      let drawWidth = maxLogoWidth
      let drawHeight = (imgH / imgW) * drawWidth
      if (drawHeight > maxLogoHeight) {
        drawHeight = maxLogoHeight
        drawWidth = (imgW / imgH) * drawHeight
      }

      doc.addImage(logo.dataUrl, 'PNG', logoX, logoY, drawWidth, drawHeight, undefined, 'FAST')
      logoHeight = drawHeight
      contentStartY = logoY + logoHeight + 5
    } catch (error) {
      console.error('Failed to load company logo:', error)
    }
  }

  // Header - Classic Indigo Theme
  doc.setFontSize(28)
  doc.setTextColor(79, 70, 229) // Indigo
  doc.text('INVOICE', 140, 20, { align: 'right' })

  // Decorative line
  doc.setDrawColor(79, 70, 229)
  doc.setLineWidth(0.5)
  const invoiceText = 'INVOICE'
  const textWidth = (doc as any).getTextWidth
    ? (doc as any).getTextWidth(invoiceText)
    : 30
  const lineXEnd = 140
  const padding = 2
  const lineXStart = lineXEnd - textWidth - padding
  doc.line(lineXStart, 23, lineXEnd + padding, 23)

  // Company Info
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(companyInfo.company_name || companyInfo.name || 'Your Company', 20, contentStartY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  let companyY = contentStartY + 5
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
      companyY += 4
    }
  }
  if (companyInfo.tax_id) {
    doc.text(`Tax ID: ${companyInfo.tax_id}`, 20, companyY)
  }

  // Invoice Details
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Invoice #: ${invoice.invoice_number}`, 190, 30, { align: 'right' })
  doc.text(`Issue Date: ${formatDate(invoice.issue_date)}`, 190, 35, { align: 'right' })
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 190, 40, { align: 'right' })

  // Status badge
  const statusColors: any = {
    draft: [156, 163, 175],
    sent: [79, 70, 229],
    paid: [20, 184, 166],
    overdue: [239, 68, 68],
    cancelled: [107, 114, 128],
  }
  const color = statusColors[invoice.status] || [156, 163, 175]
  doc.setFillColor(color[0], color[1], color[2])
  doc.setTextColor(255, 255, 255)
  doc.roundedRect(160, 44, 30, 6, 2, 2, 'F')
  doc.text(invoice.status.toUpperCase(), 162, 48)
  doc.setTextColor(0, 0, 0)

  // Bill To
  const billToY = Math.max(companyY + 10, 60)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 20, billToY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  let customerY = billToY + 6
  doc.text(invoice.customer.name, 20, customerY)
  customerY += 5

  if (invoice.customer.company) {
    doc.text(invoice.customer.company, 20, customerY)
    customerY += 5
  }
  if (invoice.customer.email) {
    doc.text(invoice.customer.email, 20, customerY)
    customerY += 5
  }
  if (invoice.customer.address) {
    doc.text(invoice.customer.address, 20, customerY)
    customerY += 5
    const cityStateZip = [
      invoice.customer.city,
      invoice.customer.state,
      invoice.customer.zip,
    ]
      .filter(Boolean)
      .join(', ')
    if (cityStateZip) {
      doc.text(cityStateZip, 20, customerY)
      customerY += 5
    }
    if (invoice.customer.country) {
      doc.text(invoice.customer.country, 20, customerY)
      customerY += 5
    }
  }

  // Items Table
  const tableStartY = customerY + 10
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
      fillColor: [79, 70, 229], // Indigo
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
