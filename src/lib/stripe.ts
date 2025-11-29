import Stripe from 'stripe'

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
  })
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? getStripe()
  : null as unknown as Stripe

export const getStripePublishableKey = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  }
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
}

// Subscription price mapping (in cents)
export const SUBSCRIPTION_PRICES = {
  free: 0,
  basic: 1900, // $19.00
  pro: 4900, // $49.00
  enterprise: 19900, // $199.00
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PRICES
