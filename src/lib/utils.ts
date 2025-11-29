import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'MYR', locale?: string): string {
  // Determine locale based on currency if not provided
  const currencyLocaleMap: Record<string, string> = {
    'USD': 'en-US',
    'EUR': 'de-DE',
    'GBP': 'en-GB',
    'JPY': 'ja-JP',
    'AUD': 'en-AU',
    'CAD': 'en-CA',
    'CHF': 'de-CH',
    'CNY': 'zh-CN',
    'INR': 'en-IN',
    'MXN': 'es-MX',
    'BRL': 'pt-BR',
    'ZAR': 'en-ZA',
    'SGD': 'en-SG',
    'HKD': 'zh-HK',
    'NZD': 'en-NZ',
    'SEK': 'sv-SE',
    'NOK': 'nb-NO',
    'DKK': 'da-DK',
    'PLN': 'pl-PL',
    'THB': 'th-TH',
    'MYR': 'ms-MY',
    'PHP': 'en-PH',
    'IDR': 'id-ID',
    'KRW': 'ko-KR',
    'TRY': 'tr-TR',
    'AED': 'ar-AE',
    'SAR': 'ar-SA',
  }

  const formatLocale = locale || currencyLocaleMap[currency] || 'en-US'

  return new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function generateInvoiceNumber(): string {
  const prefix = 'INV'
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}-${random}`
}
