"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BarChart3, FileText, Users, Zap, Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from '@/lib/utils'
import { getUserCurrency } from '@/lib/currency'

type SubscriptionPlan = {
  id: string
  name: string
  tier: string
  price: number
  billing_period: string
  features: string[]
  max_customers: number
  max_invoices_per_month: number
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currency, setCurrency] = useState<string>('MYR')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadPlans()

    ;(async () => {
      try {
        const c = await getUserCurrency()
        setCurrency(c)
      } catch (e) {
        // keep default
      }
    })()
  }, [])

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, tier, price, billing_period, features, max_customers, max_invoices_per_month')
        .order('price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-indigo-100 to-white">
      {/* Header */}
      <header className="border-b border-primary/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors mr-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">GetInvoice</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">Get Started</Button>
            </Link>
          </nav>

          {/* mobile button moved to the left side for compact view */}
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary/20 bg-white">
            <nav className="container mx-auto px-4 py-4 flex flex-col space-y-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-center">Login</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">Get Started</Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-r from-primary/20 via-primary/20 to-secondary/20 rounded-full blur-3xl"></div>
            <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent mb-4 sm:mb-6 px-2">
              Modern CRM & Invoice Management
            </h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 px-4">
            Streamline your customer relationships and create professional invoices in minutes.
            Built for modern businesses.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/30">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">Everything You Need</h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">Powerful features to manage your business efficiently and scale effortlessly</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* CRM System Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
            <Card className="relative h-full border-0 bg-white hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
              <CardHeader className="pb-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
                  <div className="relative p-4 bg-gradient-to-br from-primary to-secondary rounded-2xl inline-block transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">CRM System</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-gray-600">
                  Manage customers, track interactions, and build lasting relationships with an intuitive interface
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span>Contact Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span>Interaction Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span>Customer Insights</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Generator Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
            <Card className="relative h-full border-0 bg-white hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
              <CardHeader className="pb-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
                  <div className="relative p-4 bg-gradient-to-br from-primary to-secondary rounded-2xl inline-block transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Invoice Generator</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-gray-600">
                  Create beautiful, professional invoices with customizable templates and instant PDF export
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span>Custom Templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span>PDF Export</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span>Multi-Currency</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
            <Card className="relative h-full border-0 bg-white hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
              <CardHeader className="pb-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
                  <div className="relative p-4 bg-gradient-to-br from-primary to-secondary rounded-2xl inline-block transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <BarChart3 className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Analytics</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-gray-600">
                  Get deep insights into your business performance with powerful analytics and reporting
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                    <span>Revenue Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                    <span>Visual Reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                    <span>Performance Metrics</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fast & Secure Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
            <Card className="relative h-full border-0 bg-white hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
              <CardHeader className="pb-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
                  <div className="relative p-4 bg-gradient-to-br from-primary to-secondary rounded-2xl inline-block transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Fast & Secure</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-gray-600">
                  Built with cutting-edge technology ensuring blazing-fast performance and enterprise-grade security
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span>Lightning Fast</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span>Bank-Level Security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span>99.9% Uptime</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">Simple Pricing</h2>
          <p className="text-sm sm:text-base text-gray-700">Choose the plan that fits your business</p>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading pricing...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const isPopular = plan.tier === 'basic'
              const cardColors = [
                { border: 'border-gray-200 hover:border-gray-300', title: 'text-gray-900', price: 'from-gray-700 to-gray-900' },
                { border: 'border-primary shadow-xl shadow-primary/20', title: 'text-primary', price: 'from-primary to-secondary' },
                { border: 'border-primary/50 hover:border-primary hover:shadow-primary/20', title: 'text-primary', price: 'from-primary to-secondary' },
                { border: 'border-secondary/50 hover:border-secondary hover:shadow-secondary/20', title: 'text-secondary', price: 'from-secondary to-primary' },
              ]
              const colors = cardColors[index] || cardColors[0]

              return (
                <Card key={plan.id} className={`border-2 ${colors.border} transition-all hover:shadow-lg relative overflow-hidden flex flex-col`}>
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white text-xs px-3 py-1 rounded-bl-lg font-semibold">
                      POPULAR
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className={colors.title}>{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.tier === 'free' && 'For getting started'}
                      {plan.tier === 'basic' && 'For small businesses'}
                      {plan.tier === 'pro' && 'For growing teams'}
                      {plan.tier === 'enterprise' && 'For large organizations'}
                    </CardDescription>
                    <div className="mt-4">
                      <span className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${colors.price} bg-clip-text text-transparent`}>
                        {formatCurrency(plan.price, currency)}
                      </span>
                      <span className="text-sm sm:text-base text-gray-600">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <ul className="space-y-2 text-sm text-gray-600 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i}>✓ {feature}</li>
                      ))}
                    </ul>
                    <Link href="/register" className="mt-4">
                      <Button
                        className={`w-full transition-all duration-200 ${
                          isPopular
                            ? 'bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
                            : 'border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-md active:scale-[0.98]'
                        }`}
                        variant={isPopular ? 'default' : 'ghost'}
                      >
                        {plan.tier === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-gradient-to-r from-slate-100 to-primary/10 py-8 sm:py-12">
        <div className="container mx-auto px-4 text-center text-gray-700">
          <p className="text-sm sm:text-base">&copy; 2024 GetInvoice. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
