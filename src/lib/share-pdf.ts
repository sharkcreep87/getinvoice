import jsPDF from 'jspdf'

/**
 * Share a PDF file using the native Web Share API (iOS/Android)
 * @param pdf - The jsPDF document to share
 * @param filename - The filename for the PDF (e.g., "invoice-001.pdf")
 * @returns Promise that resolves when sharing is complete or rejects with error
 */
export async function sharePDF(pdf: jsPDF, filename: string): Promise<void> {
  // Check if Web Share API is supported
  if (!navigator.share) {
    throw new Error('Web Share API is not supported in this browser')
  }

  // Check if file sharing is supported
  if (!navigator.canShare) {
    throw new Error('File sharing is not supported in this browser')
  }

  // Generate PDF as blob
  const pdfBlob = pdf.output('blob')

  // Create a File object from the blob
  const file = new File([pdfBlob], filename, { type: 'application/pdf' })

  // Check if we can share this file
  if (!navigator.canShare({ files: [file] })) {
    throw new Error('Cannot share PDF files on this device')
  }

  // Share the file
  try {
    await navigator.share({
      files: [file],
      title: filename,
      text: `Sharing ${filename}`,
    })
  } catch (error: any) {
    // User cancelled the share dialog
    if (error.name === 'AbortError') {
      throw new Error('Share cancelled')
    }
    throw error
  }
}

/**
 * Check if the device supports PDF sharing
 * @returns boolean indicating if PDF sharing is supported
 */
export function canSharePDF(): boolean {
  if (!navigator.share || !navigator.canShare) {
    return false
  }

  // Create a dummy file to test if file sharing is supported
  try {
    const dummyFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    return navigator.canShare({ files: [dummyFile] })
  } catch {
    return false
  }
}
