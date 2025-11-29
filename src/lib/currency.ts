import { createClient } from '@/lib/supabase/client'

export type CurrencyCode =
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'INR'
  | 'MXN' | 'BRL' | 'ZAR' | 'SGD' | 'HKD' | 'NZD' | 'SEK' | 'NOK' | 'DKK'
  | 'PLN' | 'THB' | 'MYR' | 'PHP' | 'IDR' | 'KRW' | 'TRY' | 'AED' | 'SAR'

export interface Currency {
  code: CurrencyCode
  name: string
  symbol: string
  decimal_digits: number
  enabled: boolean
}

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'AUD': 'A$',
  'CAD': 'C$',
  'CHF': 'CHF',
  'CNY': '¥',
  'INR': '₹',
  'MXN': '$',
  'BRL': 'R$',
  'ZAR': 'R',
  'SGD': 'S$',
  'HKD': 'HK$',
  'NZD': 'NZ$',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'PLN': 'zł',
  'THB': '฿',
  'MYR': 'RM',
  'PHP': '₱',
  'IDR': 'Rp',
  'KRW': '₩',
  'TRY': '₺',
  'AED': 'د.إ',
  'SAR': 'ر.س',
}

// Get all supported currencies from database
export async function getSupportedCurrencies(): Promise<Currency[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('currency_settings')
    .select('*')
    .eq('enabled', true)
    .order('code')

  if (error) {
    console.error('Error fetching currencies:', error)
    return getDefaultCurrencies()
  }

  return data || getDefaultCurrencies()
}

// Fallback currencies if database fetch fails
function getDefaultCurrencies(): Currency[] {
  return [
    { code: 'USD', name: 'US Dollar', symbol: '$', decimal_digits: 2, enabled: true },
    { code: 'EUR', name: 'Euro', symbol: '€', decimal_digits: 2, enabled: true },
    { code: 'GBP', name: 'British Pound', symbol: '£', decimal_digits: 2, enabled: true },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimal_digits: 0, enabled: true },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimal_digits: 2, enabled: true },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimal_digits: 2, enabled: true },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimal_digits: 2, enabled: true },
  ]
}

// Get user's preferred currency
export async function getUserCurrency(): Promise<CurrencyCode> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'USD'

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', user.id)
    .single()

  return (profile?.currency as CurrencyCode) || 'USD'
}

// Update user's preferred currency
export async function updateUserCurrency(currency: CurrencyCode): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('profiles')
    .update({ currency })
    .eq('id', user.id)

  return !error
}

// Get currency symbol
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currency] || '$'
}

// Format amount with currency
export function formatAmount(amount: number, currency: CurrencyCode): string {
  const currencyLocaleMap: Record<CurrencyCode, string> = {
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

  const locale = currencyLocaleMap[currency] || 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}
