'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText } from "lucide-react"
import { formatCurrency } from '@/lib/utils'
import { getUserCurrency } from '@/lib/currency'
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

type SubscriptionPlan = {
  id: string
  name: string
  tier: string
  price: number
  billing_period: string
}

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'basic' | 'pro' | 'enterprise'>('free')
  const [loading, setLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currency, setCurrency] = useState<string>('MYR')
  const [plansLoading, setPlansLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadPlans()
    // fetch user's preferred currency (falls back to MYR)
    ;(async () => {
      try {
        const c = await getUserCurrency()
        setCurrency(c)
      } catch (e) {
        // ignore - keep default
      }
    })()
  }, [])

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, tier, price, billing_period')
        .order('price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setPlansLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    // Basic client-side validation first
    if (password !== confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match. Please check and try again.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            subscription_tier: subscriptionTier,
            currency: currency,
          },
          // redirect to callback handler which processes confirmation and redirects to login
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })

      if (authError) throw authError

      // Show success state instead of redirecting
      setRegisteredEmail(email)
      setRegistrationSuccess(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show success message if registration was successful
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-white px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <FileText className="h-10 w-10 text-primary" />
              <span className="text-3xl font-bold text-gray-900">GetInvoice</span>
            </Link>
          </div>
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-primary">Check Your Email!</CardTitle>
              <CardDescription className="text-base mt-2">
                We've sent a confirmation link to
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="font-semibold text-lg text-gray-900">{registeredEmail}</p>

              <div className="bg-primary/5 rounded-lg p-4 text-left space-y-2">
                <p className="text-sm font-medium text-gray-900">Next steps:</p>
                <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
                  <li>Open your email inbox</li>
                  <li>Click the confirmation link in the email</li>
                  <li>You'll be redirected to login</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-gray-600 mb-3">
                  Didn't receive the email? Check your spam folder or wait a few minutes.
                </p>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-md active:scale-[0.98] transition-all duration-200"
                  >
                    Go to Login Page
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-white px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <FileText className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold text-gray-900">GetInvoice</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Get started with your free account</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Retype password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Select Plan</Label>
                <Select value={subscriptionTier} onValueChange={(value: any) => setSubscriptionTier(value)} disabled={plansLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={plansLoading ? "Loading plans..." : "Choose a plan"} />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.tier}>
                        {plan.name} - {formatCurrency(plan.price, currency)}/{plan.billing_period === 'monthly' ? 'month' : 'year'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
              <p className="text-sm text-gray-600 text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
