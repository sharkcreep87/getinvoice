import { formatCurrency } from '@/lib/utils'

export type OrderItem = {
  name: string
  quantity: number
  unit_price: number
  amount: number
}

export type OrderMessageData = {
  orderId: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  tax: number
  taxRate: number
  discount?: number
  total: number
  currency: string
  customerName?: string
  orderLink: string
  companyName?: string
}

/**
 * Generate order request message from customer to business
 */
export function generateOrderRequestMessage(data: OrderMessageData): string {
  const itemsList = data.items
    .map(item => `• ${item.name} x ${item.quantity} = ${formatCurrency(item.amount, data.currency)}`)
    .join('\n')

  let message = `Hi${data.companyName ? ` ${data.companyName}` : ''}! I'd like to place an order:\n\n`
  message += `📋 *Order #${data.orderNumber}*\n\n`
  message += `*Items:*\n${itemsList}\n\n`
  message += `*Order Summary:*\n`
  message += `Subtotal: ${formatCurrency(data.subtotal, data.currency)}\n`

  if (data.discount && data.discount > 0) {
    message += `Discount: -${formatCurrency(data.discount, data.currency)}\n`
  }

  message += `Tax (${data.taxRate}%): ${formatCurrency(data.tax, data.currency)}\n`
  message += `*Total: ${formatCurrency(data.total, data.currency)}*\n\n`
  message += `Please confirm my order and send payment details.\n\n`
  message += `📎 Order Link: ${data.orderLink}`

  return message
}

/**
 * Generate order confirmation message from business to customer
 */
export function generateOrderConfirmationMessage(data: OrderMessageData): string {
  let message = `Hello${data.customerName ? ` ${data.customerName}` : ''}! 👋\n\n`
  message += `Your order has been confirmed! ✅\n\n`
  message += `📋 *Order #${data.orderNumber}*\n\n`
  message += `*Total Amount:* ${formatCurrency(data.total, data.currency)}\n\n`
  message += `We'll send you the payment details shortly.\n\n`
  message += `Track your order: ${data.orderLink}\n\n`
  message += `Thank you for your business! 🙏`

  return message
}

/**
 * Generate payment link message
 */
export function generatePaymentLinkMessage(
  data: OrderMessageData,
  paymentLink: string,
  invoiceNumber?: string
): string {
  let message = `💳 *Payment Details*\n\n`
  message += `Order #${data.orderNumber}\n`

  if (invoiceNumber) {
    message += `Invoice #${invoiceNumber}\n`
  }

  message += `Amount: *${formatCurrency(data.total, data.currency)}*\n\n`
  message += `Please click the link below to make payment:\n`
  message += `${paymentLink}\n\n`
  message += `Once paid, please reply with payment confirmation. Thank you! 🙏`

  return message
}

/**
 * Generate order status update message
 */
export function generateStatusUpdateMessage(
  orderNumber: string,
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  additionalInfo?: string
): string {
  const statusEmojis = {
    confirmed: '✅',
    processing: '⚙️',
    shipped: '📦',
    delivered: '🎉',
    cancelled: '❌',
  }

  const statusTexts = {
    confirmed: 'confirmed',
    processing: 'being processed',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
  }

  let message = `${statusEmojis[status]} *Order Status Update*\n\n`
  message += `Order #${orderNumber} is now *${statusTexts[status]}*.\n\n`

  if (additionalInfo) {
    message += `${additionalInfo}\n\n`
  }

  message += `Thank you for your patience! 🙏`

  return message
}

/**
 * Generate custom message from template with placeholders
 */
export function generateCustomMessage(
  template: string,
  data: OrderMessageData
): string {
  const itemsList = data.items
    .map(item => `• ${item.name} x ${item.quantity} = ${formatCurrency(item.amount, data.currency)}`)
    .join('\n')

  return template
    .replace(/\{\{order_id\}\}/g, data.orderId)
    .replace(/\{\{order_number\}\}/g, data.orderNumber)
    .replace(/\{\{items\}\}/g, itemsList)
    .replace(/\{\{subtotal\}\}/g, formatCurrency(data.subtotal, data.currency))
    .replace(/\{\{tax\}\}/g, formatCurrency(data.tax, data.currency))
    .replace(/\{\{tax_rate\}\}/g, data.taxRate.toString())
    .replace(/\{\{discount\}\}/g, formatCurrency(data.discount || 0, data.currency))
    .replace(/\{\{total\}\}/g, formatCurrency(data.total, data.currency))
    .replace(/\{\{order_link\}\}/g, data.orderLink)
    .replace(/\{\{customer_name\}\}/g, data.customerName || 'Customer')
    .replace(/\{\{company_name\}\}/g, data.companyName || '')
}

/**
 * Generate WhatsApp message preview for display
 */
export function generateMessagePreview(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}
