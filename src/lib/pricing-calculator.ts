/**
 * Pricing Calculator Utility Functions
 * Provides calculations for cost-plus, margin-based pricing, and profit analysis
 */

export type PricingMode = 'markup' | 'margin' | 'manual'

export type PricingCalculation = {
  sellingPrice: number
  profit: number
  profitMargin: number
  markup: number
  marginHealth: 'healthy' | 'acceptable' | 'low'
}

/**
 * Calculate selling price from cost and markup percentage
 * Formula: Selling Price = Cost × (1 + Markup% / 100)
 */
export function calculatePriceFromMarkup(cost: number, markupPercent: number): number {
  if (cost < 0 || markupPercent < 0) return 0
  return cost * (1 + markupPercent / 100)
}

/**
 * Calculate selling price from cost and desired margin percentage
 * Formula: Selling Price = Cost / (1 - Margin% / 100)
 */
export function calculatePriceFromMargin(cost: number, marginPercent: number): number {
  if (cost < 0 || marginPercent < 0 || marginPercent >= 100) return 0
  return cost / (1 - marginPercent / 100)
}

/**
 * Calculate markup percentage from cost and selling price
 * Formula: Markup% = ((Selling Price - Cost) / Cost) × 100
 */
export function calculateMarkup(cost: number, sellingPrice: number): number {
  if (cost <= 0) return 0
  return ((sellingPrice - cost) / cost) * 100
}

/**
 * Calculate profit margin percentage from cost and selling price
 * Formula: Margin% = ((Selling Price - Cost) / Selling Price) × 100
 */
export function calculateMargin(cost: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0
  return ((sellingPrice - cost) / sellingPrice) * 100
}

/**
 * Calculate profit amount
 * Formula: Profit = Selling Price - Cost
 */
export function calculateProfit(cost: number, sellingPrice: number): number {
  return Math.max(0, sellingPrice - cost)
}

/**
 * Convert margin percentage to markup percentage
 * Formula: Markup% = (Margin% / (100 - Margin%)) × 100
 */
export function marginToMarkup(marginPercent: number): number {
  if (marginPercent >= 100 || marginPercent < 0) return 0
  return (marginPercent / (100 - marginPercent)) * 100
}

/**
 * Convert markup percentage to margin percentage
 * Formula: Margin% = (Markup% / (100 + Markup%)) × 100
 */
export function markupToMargin(markupPercent: number): number {
  if (markupPercent < 0) return 0
  return (markupPercent / (100 + markupPercent)) * 100
}

/**
 * Determine margin health status
 * - Healthy: >= 30%
 * - Acceptable: 15-29%
 * - Low: < 15%
 */
export function getMarginHealth(marginPercent: number): 'healthy' | 'acceptable' | 'low' {
  if (marginPercent >= 30) return 'healthy'
  if (marginPercent >= 15) return 'acceptable'
  return 'low'
}

/**
 * Get complete pricing calculations
 */
export function calculatePricing(
  cost: number,
  sellingPrice: number
): PricingCalculation {
  const profit = calculateProfit(cost, sellingPrice)
  const profitMargin = calculateMargin(cost, sellingPrice)
  const markup = calculateMarkup(cost, sellingPrice)
  const marginHealth = getMarginHealth(profitMargin)

  return {
    sellingPrice,
    profit,
    profitMargin,
    markup,
    marginHealth,
  }
}

/**
 * Calculate selling price based on pricing mode
 */
export function calculateSellingPrice(
  cost: number,
  mode: PricingMode,
  percentage: number,
  manualPrice?: number
): number {
  switch (mode) {
    case 'markup':
      return calculatePriceFromMarkup(cost, percentage)
    case 'margin':
      return calculatePriceFromMargin(cost, percentage)
    case 'manual':
      return manualPrice || 0
    default:
      return 0
  }
}

/**
 * Validate pricing inputs
 */
export function validatePricingInputs(
  cost: number,
  percentage: number,
  mode: PricingMode
): { valid: boolean; error?: string } {
  if (cost < 0) {
    return { valid: false, error: 'Cost cannot be negative' }
  }

  if (cost === 0 && mode !== 'manual') {
    return { valid: false, error: 'Cost must be greater than 0' }
  }

  if (percentage < 0) {
    return { valid: false, error: 'Percentage cannot be negative' }
  }

  if (mode === 'margin' && percentage >= 100) {
    return { valid: false, error: 'Margin must be less than 100%' }
  }

  return { valid: true }
}
