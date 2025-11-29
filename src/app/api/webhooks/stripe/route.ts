import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Helper function to get Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId
  const tier = session.metadata?.tier

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Update user subscription tier
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: tier,
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Error updating subscription tier:', updateError)
    throw updateError
  }

  // Create payment record
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      amount: session.amount_total! / 100,
      currency: session.currency!,
      status: 'succeeded',
      tier: tier,
    })

  if (paymentError) {
    console.error('Error creating payment record:', paymentError)
  }

  console.log(`Subscription activated for user ${userId} - tier: ${tier}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  // Update subscription status
  const { error } = await supabaseAdmin.from('payments').update({
    status: subscription.status,
  }).eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription status:', error)
  }

  console.log(`Subscription updated for user ${userId} - status: ${subscription.status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  // Downgrade user to free tier
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: 'free',
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Error downgrading to free tier:', updateError)
    throw updateError
  }

  // Update payment record
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id)

  if (paymentError) {
    console.error('Error updating payment record:', paymentError)
  }

  console.log(`Subscription canceled for user ${userId}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) return

  const { error } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'succeeded',
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating payment status:', error)
  }

  console.log(`Payment succeeded for subscription ${subscriptionId}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) return

  const { error } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'failed',
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating payment status:', error)
  }

  console.log(`Payment failed for subscription ${subscriptionId}`)
}
