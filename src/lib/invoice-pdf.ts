import jsPDF from 'jspdf'
import { generateClassicTemplate, type InvoiceData, type CompanyInfo } from './invoice-templates/classic'
import { generateModernTemplate } from './invoice-templates/modern'
import { generateMinimalTemplate } from './invoice-templates/minimal'

// Re-export types for backward compatibility
export type { InvoiceData, CompanyInfo }

export type InvoiceTemplate = 'classic' | 'modern' | 'minimal'

export async function generateInvoicePDF(
  invoice: InvoiceData,
  companyInfo: CompanyInfo,
  currency?: string,
  template: InvoiceTemplate = 'classic'
): Promise<jsPDF> {
  // Select template based on parameter
  switch (template) {
    case 'modern':
      return generateModernTemplate(invoice, companyInfo, currency)
    case 'minimal':
      return generateMinimalTemplate(invoice, companyInfo, currency)
    case 'classic':
    default:
      return generateClassicTemplate(invoice, companyInfo, currency)
  }
}

// Legacy function for backward compatibility - uses classic template
export async function generateInvoicePDFLegacy(invoice: InvoiceData, companyInfo: CompanyInfo, currency?: string) {
  return generateClassicTemplate(invoice, companyInfo, currency)
}
