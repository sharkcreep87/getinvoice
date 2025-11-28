'use client'

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CreditCard, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise'

const plans = [
  {
    tier: 'free' as SubscriptionTier,
    name: 'Free',
    price: 0,
    description: 'For getting started',
    features: [
      '5 customers',
      '10 invoices per month',
      'Basic support',
      'Email notifications',
    ],
    maxCustomers: 5,
    maxInvoicesPerMonth: 10,
  },
  {
    tier: 'basic' as SubscriptionTier,
    name: 'Basic',
    price: 19,
    description: 'For small businesses',
    features: [
      '50 customers',
      '100 invoices per month',
      'Email support',
      'Custom branding',
      'PDF export',
      'Advanced analytics',
    ],
    maxCustomers: 50,
    maxInvoicesPerMonth: 100,
    popular: true,
  },
  {
    tier: 'pro' as SubscriptionTier,
    name: 'Pro',
    price: 49,
    description: 'For growing teams',
    features: [
      'Unlimited customers',
      'Unlimited invoices',
      'Priority support',
      'Advanced analytics',
      'API access',
      'Custom integrations',
      'Multi-currency support',
    ],
    maxCustomers: -1,
    maxInvoicesPerMonth: -1,
  },
  {
    tier: 'enterprise' as SubscriptionTier,
    name: 'Enterprise',
    price: 199,
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Multi-user access',
      'Advanced security',
      'Custom reporting',
      'White-label solution',
    ],
    maxCustomers: -1,
    maxInvoicesPerMonth: -1,
  },
]

export default function SubscriptionPage() {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free')
  const [loading, setLoading] = useState(true)
  const [processingTier, setProcessingTier] = useState<SubscriptionTier | null>(null)
  const [cancelingSubscription, setCancelingSubscription] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadSubscription()

    // Check for canceled payment
    if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. No charges were made.",
        variant: "destructive",
      })
    }
  }, [])

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setCurrentTier(profile?.subscription_tier || 'free')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load subscription",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setProcessingTier(tier)

    try {
      // Free tier - direct downgrade
      if (tier === 'free') {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Not authenticated")

        const { error } = await supabase
          .from('profiles')
          .update({ subscription_tier: tier })
          .eq('id', user.id)

        if (error) throw error

        setCurrentTier(tier)
        toast({
          title: "Success",
          description: "Downgraded to Free plan",
        })
        return
      }

      // Paid tiers - redirect to Stripe checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process upgrade",
        variant: "destructive",
      })
      setProcessingTier(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll be downgraded to the Free plan at the end of your billing period.")) {
      return
    }

    setCancelingSubscription(true)

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      toast({
        title: "Subscription Canceled",
        description: "Your subscription will be canceled at the end of the billing period.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      })
    } finally {
      setCancelingSubscription(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600">Manage your subscription plan</p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the{' '}
            <span className="font-bold text-blue-600 capitalize">{currentTier}</span> plan
          </CardDescription>
        </CardHeader>
        {currentTier !== 'free' && (
          <CardContent>
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              disabled={cancelingSubscription}
            >
              {cancelingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrentPlan = plan.tier === currentTier
          const isProcessing = processingTier === plan.tier
          const canUpgrade = plans.findIndex(p => p.tier === currentTier) < plans.findIndex(p => p.tier === plan.tier)
          const canDowngrade = plans.findIndex(p => p.tier === currentTier) > plans.findIndex(p => p.tier === plan.tier)

          return (
            <Card
              key={plan.tier}
              className={`relative ${
                plan.popular ? 'border-blue-600 shadow-lg' : ''
              } ${isCurrentPlan ? 'bg-blue-50 border-blue-600' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Popular
                  </span>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Current
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Upgrade
                      </>
                    )}
                  </Button>
                ) : canDowngrade ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Downgrade'
                    )}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            All payments are securely processed through Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Check className="h-5 w-5 text-green-600" />
              <span>Secure payment processing with Stripe</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Check className="h-5 w-5 text-green-600" />
              <span>Cancel anytime - no long-term contracts</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Check className="h-5 w-5 text-green-600" />
              <span>Automatic billing on monthly basis</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Check className="h-5 w-5 text-green-600" />
              <span>Instant plan activation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Have questions about our pricing or need a custom plan?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Contact our sales team for enterprise solutions and custom pricing.
          </p>
          <Button variant="outline">Contact Sales</Button>
        </CardContent>
      </Card>
    </div>
  )
}
