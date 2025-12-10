/**
 * Intent Detector
 *
 * Analyzes incoming message text to determine user intent
 * Uses keyword matching and pattern recognition
 */

export type MessageIntent =
  | 'greeting'
  | 'product_query'
  | 'appointment'
  | 'payment'
  | 'help'
  | 'general'
  | 'unknown'

/**
 * Detect user intent from message text
 */
export function detectIntent(messageBody: string): MessageIntent {
  const text = messageBody.toLowerCase().trim()

  // Greeting patterns
  const greetingPatterns = [
    /^(hi|hello|hey|good morning|good afternoon|good evening|hai|helo)/i,
    /^(assalamualaikum|salam)/i,
  ]
  if (greetingPatterns.some(pattern => pattern.test(text))) {
    return 'greeting'
  }

  // Help patterns
  const helpPatterns = [
    /\b(help|bantuan|tolong|assist|support)\b/i,
    /what (can|do) you (do|offer)/i,
    /how (can|do) (you|this) (help|work)/i,
  ]
  if (helpPatterns.some(pattern => pattern.test(text))) {
    return 'help'
  }

  // Appointment patterns
  const appointmentPatterns = [
    /\b(book|schedule|appointment|meeting|temujanji|jumpa)\b/i,
    /\b(available|slot|time|date|bila|when)\b.*\b(appointment|meet|jumpa)\b/i,
    /\b(want|need|nak).*(appointment|meeting|temujanji)/i,
  ]
  if (appointmentPatterns.some(pattern => pattern.test(text))) {
    return 'appointment'
  }

  // Payment patterns
  const paymentPatterns = [
    /\b(buy|purchase|order|beli|bayar|payment|pay)\b/i,
    /\b(price|cost|harga|berapa|how much)\b/i,
    /\b(checkout|cart|keranjang)\b/i,
    /\b(want|nak|need).*(buy|purchase|order)/i,
  ]
  if (paymentPatterns.some(pattern => pattern.test(text))) {
    // Check if also asking about products
    const productKeywords = /\b(product|barang|item|stock|inventory|ada|have|do you have)\b/i
    if (productKeywords.test(text)) {
      return 'product_query'
    }
    return 'payment'
  }

  // Product query patterns
  const productPatterns = [
    /\b(product|barang|item|stock|inventory)\b/i,
    /\b(ada|have|available|sell|jual|menjual)\b/i,
    /\b(what|apa).*(sell|jual|product|barang)/i,
    /\b(show|tunjuk|display).*(product|barang|catalogue|catalog)/i,
    /\b(info|information|maklumat|details|detail).*(product|barang)/i,
  ]
  if (productPatterns.some(pattern => pattern.test(text))) {
    return 'product_query'
  }

  // If no specific intent detected, return general
  return 'general'
}

/**
 * Extract keywords from message for knowledge base search
 */
export function extractKeywords(messageBody: string): string[] {
  const text = messageBody.toLowerCase()

  // Remove common stop words
  const stopWords = [
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'can', 'could', 'should', 'may', 'might', 'must',
    'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'this', 'that', 'these', 'those',
    'what', 'when', 'where', 'why', 'how',
    'ada', 'apa', 'bila', 'berapa', 'macam', 'mana',
  ]

  // Extract words (alphanumeric + numbers)
  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !stopWords.includes(word))

  // Return unique keywords
  return [...new Set(words)]
}
