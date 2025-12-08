import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from '../utils'
import { InvoiceData, CompanyInfo } from './classic'

// Helper function to load image as data URL
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

export async function generateMinimalTemplate(
  invoice: InvoiceData,
  companyInfo: CompanyInfo,
  currency?: string
): Promise<jsPDF> {
  const invoiceCurrency = currency || invoice.currency || 'MYR'
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // White background
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Simple top border accent
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.line(20, 20, pageWidth - 20, 20)

  // Company logo (minimal, top left)
  let currentY = 30
  if (companyInfo.company_logo_url) {
    try {
      const logo = await loadImageAsDataURL(companyInfo.company_logo_url)
      const maxLogoWidth = 35
      const maxLogoHeight = 18
      const logoX = 20
      const logoY = currentY

      const imgW = logo.width
      const imgH = logo.height

      let drawWidth = maxLogoWidth
      let drawHeight = (imgH / imgW) * drawWidth
      if (drawHeight > maxLogoHeight) {
        drawHeight = maxLogoHeight
        drawWidth = (imgW / imgH) * drawHeight
      }

      doc.addImage(logo.dataUrl, 'PNG', logoX, logoY, drawWidth, drawHeight, undefined, 'FAST')
      currentY = logoY + drawHeight + 10
    } catch (error) {
      console.error('Failed to load company logo:', error)
    }
  }

  // INVOICE - minimal typography
  doc.setFontSize(36)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.text('Invoice', 20, currentY)
  currentY += 12

  // Invoice number - subtle
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text(`#${invoice.invoice_number}`, 20, currentY)
  currentY += 15

  // Two column layout - Company and Bill To
  const leftCol = 20
  const rightCol = 115

  // Company Info (Left) - minimalist
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text('From', leftCol, currentY)
  currentY += 5

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(companyInfo.company_name || companyInfo.name || 'Your Company', leftCol, currentY)
  currentY += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)

  if (companyInfo.company_email) {
    doc.text(companyInfo.company_email, leftCol, currentY)
    currentY += 4
  }
  if (companyInfo.company_phone) {
    doc.text(companyInfo.company_phone, leftCol, currentY)
    currentY += 4
  }
  if (companyInfo.company_address) {
    doc.text(companyInfo.company_address, leftCol, currentY)
    currentY += 4
    const cityStateZip = [
      companyInfo.company_city,
      companyInfo.company_state,
      companyInfo.company_zip,
    ].filter(Boolean).join(', ')
    if (cityStateZip) {
      doc.text(cityStateZip, leftCol, currentY)
      currentY += 4
    }
  }

  // Reset Y for right column
  let rightY = currentY - (companyInfo.company_email ? 4 : 0) - (companyInfo.company_phone ? 4 : 0) -
               (companyInfo.company_address ? 8 : 0) - 10

  // Bill To (Right)
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text('Bill To', rightCol, rightY)
  rightY += 5

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.customer.name, rightCol, rightY)
  rightY += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)

  if (invoice.customer.company) {
    doc.text(invoice.customer.company, rightCol, rightY)
    rightY += 4
  }
  if (invoice.customer.email) {
    doc.text(invoice.customer.email, rightCol, rightY)
    rightY += 4
  }
  if (invoice.customer.address) {
    doc.text(invoice.customer.address, rightCol, rightY)
    rightY += 4
    const cityStateZip = [
      invoice.customer.city,
      invoice.customer.state,
      invoice.customer.zip,
    ].filter(Boolean).join(', ')
    if (cityStateZip) {
      doc.text(cityStateZip, rightCol, rightY)
      rightY += 4
    }
  }

  // Use the larger Y position
  currentY = Math.max(currentY, rightY) + 15

  // Invoice metadata - clean single line
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.3)
  doc.line(20, currentY, pageWidth - 20, currentY)
  currentY += 8

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text('Issue Date', 20, currentY)
  doc.text('Due Date', 70, currentY)
  doc.text('Status', 120, currentY)
  currentY += 5

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(formatDate(invoice.issue_date), 20, currentY)
  doc.text(formatDate(invoice.due_date), 70, currentY)

  // Status - minimal badge
  const statusText = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
  const statusColors: any = {
    draft: [120, 120, 120],
    sent: [0, 0, 0],
    paid: [34, 197, 94],
    overdue: [239, 68, 68],
    cancelled: [120, 120, 120],
  }
  const statusColor = statusColors[invoice.status] || [0, 0, 0]
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
  doc.text(statusText, 120, currentY)
  doc.setTextColor(0, 0, 0)

  currentY += 10
  doc.setDrawColor(230, 230, 230)
  doc.line(20, currentY, pageWidth - 20, currentY)
  currentY += 15

  // Items Table - ultra minimal
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price, invoiceCurrency),
    formatCurrency(item.amount, invoiceCurrency),
  ])

  autoTable(doc, {
    startY: currentY,
    head: [['Description', 'Qty', 'Price', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [120, 120, 120],
      fontStyle: 'normal',
      fontSize: 9,
      cellPadding: { top: 2, right: 5, bottom: 5, left: 5 },
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontSize: 9,
      cellPadding: { top: 5, right: 5, bottom: 5, left: 5 },
    },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
    },
    didDrawCell: (data: any) => {
      // Draw minimal border under header
      if (data.section === 'head') {
        doc.setDrawColor(230, 230, 230)
        doc.setLineWidth(0.3)
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        )
      }
    },
  })

  // Totals - minimal alignment
  const finalY = (doc as any).lastAutoTable.finalY + 15
  const totalsX = 125

  // Thin separator line
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.3)
  doc.line(totalsX, finalY - 5, pageWidth - 20, finalY - 5)

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')

  let totalsY = finalY
  doc.text('Subtotal', totalsX, totalsY)
  doc.setTextColor(0, 0, 0)
  doc.text(formatCurrency(invoice.subtotal, invoiceCurrency), pageWidth - 20, totalsY, { align: 'right' })
  totalsY += 5

  if (invoice.discount_amount > 0) {
    doc.setTextColor(100, 100, 100)
    doc.text('Discount', totalsX, totalsY)
    doc.setTextColor(0, 0, 0)
    doc.text(`-${formatCurrency(invoice.discount_amount, invoiceCurrency)}`, pageWidth - 20, totalsY, {
      align: 'right',
    })
    totalsY += 5
  }

  doc.setTextColor(100, 100, 100)
  doc.text(`Tax (${invoice.tax_rate}%)`, totalsX, totalsY)
  doc.setTextColor(0, 0, 0)
  doc.text(formatCurrency(invoice.tax_amount, invoiceCurrency), pageWidth - 20, totalsY, { align: 'right' })
  totalsY += 8

  // Total with thin top border
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(totalsX, totalsY - 3, pageWidth - 20, totalsY - 3)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text('Total', totalsX, totalsY + 2)
  doc.text(formatCurrency(invoice.total, invoiceCurrency), pageWidth - 20, totalsY + 2, { align: 'right' })

  // Notes and Terms - minimal styling
  let notesY = totalsY + 20

  if (invoice.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Notes', 20, notesY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    const splitNotes = doc.splitTextToSize(invoice.notes, 170)
    doc.text(splitNotes, 20, notesY + 5)
    notesY += 5 + splitNotes.length * 4 + 8
  }

  const termsToUse = companyInfo.invoice_terms || invoice.terms
  if (termsToUse) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Terms', 20, notesY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    const splitTerms = doc.splitTextToSize(termsToUse, 170)
    doc.text(splitTerms, 20, notesY + 5)
    notesY += 5 + splitTerms.length * 4 + 8
  }

  // Footer - centered, minimal
  if (companyInfo.invoice_footer) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    const splitFooter = doc.splitTextToSize(companyInfo.invoice_footer, 150)
    doc.text(splitFooter, pageWidth / 2, notesY, { align: 'center' })
  }

  return doc
}
