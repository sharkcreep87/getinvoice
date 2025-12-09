import { formatPhoneForWhatsApp } from './phone-formatter'
import { generateOrderRequestMessage, type OrderMessageData } from './message-templates'

// Re-export OrderMessageData for convenience
export type { OrderMessageData }

export type WhatsAppLinkOptions = {
  phoneNumber: string
  message: string
  countryCode?: string
}

/**
 * Generate a WhatsApp link with pre-filled message
 * Returns: https://wa.me/60123456789?text=encoded_message
 */
export function generateWhatsAppLink(options: WhatsAppLinkOptions): string {
  const { phoneNumber, message, countryCode = '60' } = options

  // Format phone number to international format
  const formattedPhone = formatPhoneForWhatsApp(phoneNumber, countryCode)

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message)

  // Generate WhatsApp link
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

/**
 * Generate WhatsApp order link with order details
 */
export function generateOrderWhatsAppLink(
  businessPhone: string,
  orderData: OrderMessageData,
  countryCode?: string
): string {
  const message = generateOrderRequestMessage(orderData)

  return generateWhatsAppLink({
    phoneNumber: businessPhone,
    message,
    countryCode,
  })
}

/**
 * Generate WhatsApp Web link (for desktop)
 */
export function generateWhatsAppWebLink(options: WhatsAppLinkOptions): string {
  const { phoneNumber, message, countryCode = '60' } = options

  const formattedPhone = formatPhoneForWhatsApp(phoneNumber, countryCode)
  const encodedMessage = encodeURIComponent(message)

  return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`
}

/**
 * Generate both mobile and web links
 */
export function generateWhatsAppLinks(options: WhatsAppLinkOptions): {
  mobile: string
  web: string
} {
  return {
    mobile: generateWhatsAppLink(options),
    web: generateWhatsAppWebLink(options),
  }
}

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Get appropriate WhatsApp link based on device
 */
export function getWhatsAppLinkForDevice(options: WhatsAppLinkOptions): string {
  return isMobileDevice()
    ? generateWhatsAppLink(options)
    : generateWhatsAppWebLink(options)
}

/**
 * Generate QR code data for WhatsApp link
 */
export function generateWhatsAppQRData(options: WhatsAppLinkOptions): string {
  return generateWhatsAppLink(options)
}

/**
 * Validate WhatsApp business phone number
 */
export function validateBusinessPhone(phone: string): {
  valid: boolean
  error?: string
} {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Phone number is required' }
  }

  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length < 10) {
    return { valid: false, error: 'Phone number is too short' }
  }

  if (cleaned.length > 15) {
    return { valid: false, error: 'Phone number is too long' }
  }

  return { valid: true }
}
