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

export async function generateModernTemplate(
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

  // Bold header banner with gradient effect (simulated with rectangles)
  doc.setFillColor(99, 102, 241) // Indigo 500
  doc.rect(0, 0, pageWidth, 50, 'F')

  // Accent strip
  doc.setFillColor(168, 85, 247) // Purple 500
  doc.rect(0, 0, pageWidth, 3, 'F')

  // Company logo in header (white background circle for contrast)
  let logoInHeader = false
  if (companyInfo.company_logo_url) {
    try {
      const logo = await loadImageAsDataURL(companyInfo.company_logo_url)
      const maxLogoWidth = 25
      const maxLogoHeight = 20
      const logoX = 20
      const logoY = 12

      const imgW = logo.width
      const imgH = logo.height

      let drawWidth = maxLogoWidth
      let drawHeight = (imgH / imgW) * drawWidth
      if (drawHeight > maxLogoHeight) {
        drawHeight = maxLogoHeight
        drawWidth = (imgW / imgH) * drawHeight
      }

      // White circle behind logo
      doc.setFillColor(255, 255, 255)
      const circleRadius = Math.max(drawWidth, drawHeight) / 2 + 2
      doc.circle(logoX + drawWidth / 2, logoY + drawHeight / 2, circleRadius, 'F')

      doc.addImage(logo.dataUrl, 'PNG', logoX, logoY, drawWidth, drawHeight, undefined, 'FAST')
      logoInHeader = true
    } catch (error) {
      console.error('Failed to load company logo:', error)
    }
  }

  // INVOICE title in header
  doc.setFontSize(32)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', pageWidth - 20, 30, { align: 'right' })

  // Invoice details in header (white text)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`#${invoice.invoice_number}`, pageWidth - 20, 38, { align: 'right' })

  // Company name in header (if no logo, show on left)
  if (!logoInHeader) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(companyInfo.company_name || companyInfo.name || 'Your Company', 20, 30)
  }

  // Company info section - clean box
  let startY = 60
  doc.setFillColor(249, 250, 251) // Gray 50
  doc.setDrawColor(229, 231, 235) // Gray 200
  doc.roundedRect(15, startY, 85, 40, 3, 3, 'FD')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128) // Gray 500
  doc.text('FROM', 20, startY + 6)

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(companyInfo.company_name || companyInfo.name || 'Your Company', 20, startY + 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  let companyY = startY + 17
  if (companyInfo.company_email) {
    doc.text(companyInfo.company_email, 20, companyY)
    companyY += 4
  }
  if (companyInfo.company_phone) {
    doc.text(companyInfo.company_phone, 20, companyY)
    companyY += 4
  }
  if (companyInfo.company_address) {
    const addressLines = doc.splitTextToSize(
      `${companyInfo.company_address}${companyInfo.company_city ? ', ' + companyInfo.company_city : ''}`,
      80
    )
    doc.text(addressLines, 20, companyY)
  }

  // Bill To section - matching box
  doc.setFillColor(249, 250, 251)
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(110, startY, 85, 40, 3, 3, 'FD')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)
  doc.text('BILL TO', 115, startY + 6)

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.customer.name, 115, startY + 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  let customerY = startY + 17
  if (invoice.customer.company) {
    doc.text(invoice.customer.company, 115, customerY)
    customerY += 4
  }
  if (invoice.customer.email) {
    doc.text(invoice.customer.email, 115, customerY)
    customerY += 4
  }
  if (invoice.customer.address) {
    const addressLines = doc.splitTextToSize(
      `${invoice.customer.address}${invoice.customer.city ? ', ' + invoice.customer.city : ''}`,
      80
    )
    doc.text(addressLines, 115, customerY)
  }

  // Invoice metadata - colorful boxes
  startY = 110
  const boxWidth = 60
  const boxHeight = 20
  const boxGap = 5

  // Issue Date Box
  doc.setFillColor(236, 254, 255) // Cyan 50
  doc.setDrawColor(103, 232, 249) // Cyan 300
  doc.setLineWidth(0.5)
  doc.roundedRect(15, startY, boxWidth, boxHeight, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('ISSUE DATE', 20, startY + 6)
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(formatDate(invoice.issue_date), 20, startY + 14)

  // Due Date Box
  doc.setFillColor(254, 249, 195) // Yellow 100
  doc.setDrawColor(250, 204, 21) // Yellow 400
  doc.roundedRect(15 + boxWidth + boxGap, startY, boxWidth, boxHeight, 2, 2, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('DUE DATE', 20 + boxWidth + boxGap, startY + 6)
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(formatDate(invoice.due_date), 20 + boxWidth + boxGap, startY + 14)

  // Status Box
  const statusColors: any = {
    draft: { bg: [243, 244, 246], border: [156, 163, 175], text: [75, 85, 99] },
    sent: { bg: [224, 231, 255], border: [99, 102, 241], text: [67, 56, 202] },
    paid: { bg: [209, 250, 229], border: [52, 211, 153], text: [6, 95, 70] },
    overdue: { bg: [254, 226, 226], border: [248, 113, 113], text: [153, 27, 27] },
    cancelled: { bg: [243, 244, 246], border: [156, 163, 175], text: [75, 85, 99] },
  }
  const statusStyle = statusColors[invoice.status] || statusColors.draft
  doc.setFillColor(statusStyle.bg[0], statusStyle.bg[1], statusStyle.bg[2])
  doc.setDrawColor(statusStyle.border[0], statusStyle.border[1], statusStyle.border[2])
  doc.roundedRect(15 + (boxWidth + boxGap) * 2, startY, boxWidth, boxHeight, 2, 2, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('STATUS', 20 + (boxWidth + boxGap) * 2, startY + 6)
  doc.setFontSize(10)
  doc.setTextColor(statusStyle.text[0], statusStyle.text[1], statusStyle.text[2])
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.status.toUpperCase(), 20 + (boxWidth + boxGap) * 2, startY + 14)

  // Items Table - Modern style
  const tableStartY = startY + boxHeight + 15
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price, invoiceCurrency),
    formatCurrency(item.amount, invoiceCurrency),
  ])

  doc.setFont('helvetica', 'normal')
  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [99, 102, 241], // Indigo 500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 5,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
  })

  // Totals - modern box style
  const finalY = (doc as any).lastAutoTable.finalY + 10
  const totalsBoxX = 120
  const totalsBoxWidth = 75

  doc.setFillColor(249, 250, 251)
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(totalsBoxX, finalY, totalsBoxWidth, 35, 3, 3, 'FD')

  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')

  let totalsY = finalY + 6
  doc.text('Subtotal:', totalsBoxX + 5, totalsY)
  doc.text(formatCurrency(invoice.subtotal, invoiceCurrency), totalsBoxX + totalsBoxWidth - 5, totalsY, {
    align: 'right',
  })
  totalsY += 5

  if (invoice.discount_amount > 0) {
    doc.text('Discount:', totalsBoxX + 5, totalsY)
    doc.text(`-${formatCurrency(invoice.discount_amount, invoiceCurrency)}`, totalsBoxX + totalsBoxWidth - 5, totalsY, {
      align: 'right',
    })
    totalsY += 5
  }

  doc.text(`Tax (${invoice.tax_rate}%):`, totalsBoxX + 5, totalsY)
  doc.text(formatCurrency(invoice.tax_amount, invoiceCurrency), totalsBoxX + totalsBoxWidth - 5, totalsY, {
    align: 'right',
  })
  totalsY += 7

  // Total with colored background
  doc.setFillColor(99, 102, 241)
  doc.roundedRect(totalsBoxX, totalsY - 4, totalsBoxWidth, 10, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL:', totalsBoxX + 5, totalsY + 2)
  doc.text(formatCurrency(invoice.total, invoiceCurrency), totalsBoxX + totalsBoxWidth - 5, totalsY + 2, {
    align: 'right',
  })

  // Notes and Terms
  doc.setTextColor(0, 0, 0)
  let currentY = finalY + 50

  if (invoice.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(99, 102, 241)
    doc.text('NOTES', 20, currentY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    const splitNotes = doc.splitTextToSize(invoice.notes, 170)
    doc.text(splitNotes, 20, currentY + 5)
    currentY += 5 + splitNotes.length * 4 + 5
  }

  const termsToUse = companyInfo.invoice_terms || invoice.terms
  if (termsToUse) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(99, 102, 241)
    doc.text('TERMS & CONDITIONS', 20, currentY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    const splitTerms = doc.splitTextToSize(termsToUse, 170)
    doc.text(splitTerms, 20, currentY + 5)
    currentY += 5 + splitTerms.length * 4 + 5
  }

  // Footer
  if (companyInfo.invoice_footer) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    const splitFooter = doc.splitTextToSize(companyInfo.invoice_footer, 170)
    doc.text(splitFooter, pageWidth / 2, currentY, { align: 'center' })
  }

  return doc
}
