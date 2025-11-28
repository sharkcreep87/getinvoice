'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
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
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadSubscription()
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
    setUpdating(true)

    try {
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
        description: `Successfully ${tier === 'free' ? 'downgraded' : 'upgraded'} to ${tier} plan`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
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
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrentPlan = plan.tier === currentTier
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
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Upgrade'}
                  </Button>
                ) : canDowngrade ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Downgrade'}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

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
