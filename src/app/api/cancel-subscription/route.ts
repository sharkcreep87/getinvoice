import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's active subscription
    const { data: payment } = await supabase
      .from('payments')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!payment || !payment.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(
      payment.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    )

    return NextResponse.json({
      success: true,
      cancelAt: subscription.cancel_at,
    })
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
