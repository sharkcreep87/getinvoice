/**
 * Format phone number to international format for WhatsApp
 * Removes spaces, dashes, and ensures proper country code
 */
export function formatPhoneForWhatsApp(phone: string, defaultCountryCode: string = '60'): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')

  // If number starts with 0, remove it (local format)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }

  // If number doesn't start with country code, add it
  if (!cleaned.startsWith(defaultCountryCode)) {
    cleaned = defaultCountryCode + cleaned
  }

  return cleaned
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  // Phone number should be between 10-15 digits
  return cleaned.length >= 10 && cleaned.length <= 15
}

/**
 * Format phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  // Malaysian format: +60 12-345 6789
  if (cleaned.startsWith('60') && cleaned.length === 11) {
    return `+60 ${cleaned.substring(2, 4)}-${cleaned.substring(4, 7)} ${cleaned.substring(7)}`
  }

  // Generic international format: +XX XXX XXX XXXX
  if (cleaned.length >= 10) {
    const countryCode = cleaned.substring(0, 2)
    const rest = cleaned.substring(2)
    return `+${countryCode} ${rest.match(/.{1,3}/g)?.join(' ') || rest}`
  }

  return phone
}
