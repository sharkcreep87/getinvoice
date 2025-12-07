'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Database } from '@/lib/supabase/database.types'
import { useToast } from "@/components/ui/use-toast"
import { LoadingPage } from "@/components/ui/loading"

type SystemSettings = {
  id?: string
  app_name: string
  support_email: string
  default_currency: string
  allow_registration: boolean
  stripe_enabled: boolean
  email_notifications_enabled: boolean
  ai_cost_forecast_prompt: string
  ai_request_limit_free: number
}

type SubscriptionPlan = {
  id: string
  name: string
  tier: string
  price: number
  billing_period: string
  max_customers: number
  max_invoices_per_month: number
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    app_name: 'GetInvoice',
    support_email: '',
    default_currency: 'MYR',
    allow_registration: true,
    stripe_enabled: false,
    email_notifications_enabled: true,
    ai_cost_forecast_prompt: `You are an AI cost-forecast assistant for a food & product pricing system.
When the user gives you a product name (for example "Karipap", "Nasi Lemak Ayam", "Iced Latte", etc.), your job is to:
1. Guess the most common recipe or composition for that product in Malaysia.
2. List all typical ingredients/components used to produce ONE UNIT of that product (one piece, one cup, one plate, etc.).
3. For each ingredient, estimate:
   - quantity per unit
   - unit of measurement (g, ml, pcs, tbsp, etc.)
   - price per unit in Malaysian Ringgit (RM)
   - cost used for one unit of product
4. Calculate:
   - total ingredient cost per unit
   - recommended selling price per unit (include a reasonable profit margin, for example 40–60%)
   - profit per unit and profit margin (%)

Make reasonable assumptions and clearly show them in an "Assumptions" section.

OUTPUT REQUIREMENTS:
- Currency must be in RM with 2 decimal places.
- If the user language is Malay, answer in Malay. If English, answer in English.
- Always provide:
  * A short description of the product
  * A clear ingredient cost table
  * A pricing summary
  * A final JSON block for system integration

The JSON must follow this structure exactly:
{
  "product_name": "...",
  "serving_unit": "...",
  "ingredients": [
    {
      "name": "...",
      "quantity": number,
      "unit": "...",
      "unit_price_rm": number,
      "cost_per_unit_rm": number
    }
  ],
  "total_cost_per_unit_rm": number,
  "suggested_selling_price_rm": number,
  "profit_per_unit_rm": number,
  "profit_margin_percent": number,
  "assumptions": [
    "..."
  ]
}

Do NOT add any extra fields in the JSON.
If the product is too generic or ambiguous, ask the user 1–2 short clarification questions before calculating.`,
    ai_request_limit_free: 5,
  })
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: string } | null }

      if (profile?.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access admin settings",
          variant: "destructive",
        })
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      loadSettings()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify admin access",
        variant: "destructive",
      })
      router.push('/dashboard')
    }
  }

  const loadSettings = async () => {
    try {
      // Load system settings from localStorage
      const savedSettings = localStorage.getItem('admin_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        // Merge with current state to ensure all fields have values (including new ai_cost_forecast_prompt)
        setSettings(prev => ({ ...prev, ...parsed }))
      }

      // Load subscription plans from database
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('id, name, tier, price, billing_period, features, max_customers, max_invoices_per_month')
        .order('price', { ascending: true })

      if (plansData) {
        setPlans(plansData)
      }
    } catch (error: any) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePlan = async (
    planId: string,
    updates: Partial<Database['public']['Tables']['subscription_plans']['Update']>
  ) => {
    try {
      // Validate price if it's being updated
      if (updates.price !== undefined) {
        const price = Number(updates.price)
        if (isNaN(price) || price < 0) {
          toast({
            title: "Invalid Price",
            description: "Please enter a valid price (0 or greater)",
            variant: "destructive",
          })
          return
        }
        updates.price = price
      }

      // Validate max_customers if it's being updated
      if (updates.max_customers !== undefined) {
        const maxCustomers = Number(updates.max_customers)
        if (isNaN(maxCustomers)) {
          toast({
            title: "Invalid Value",
            description: "Please enter a valid number for max customers",
            variant: "destructive",
          })
          return
        }
        updates.max_customers = maxCustomers
      }

      // Validate max_invoices_per_month if it's being updated
      if (updates.max_invoices_per_month !== undefined) {
        const maxInvoices = Number(updates.max_invoices_per_month)
        if (isNaN(maxInvoices)) {
          toast({
            title: "Invalid Value",
            description: "Please enter a valid number for max invoices",
            variant: "destructive",
          })
          return
        }
        updates.max_invoices_per_month = maxInvoices
      }

      const { error } = await (supabase as any)
        .from('subscription_plans')
        .update(updates as any)
        .eq('id', planId)

      if (error) throw error

      // Update local state — cast because DB Update type can be slightly different from the local SubscriptionPlan type
      setPlans(plans.map(p => p.id === planId ? { ...p, ...(updates as Partial<SubscriptionPlan>) } : p))

      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update plan",
        variant: "destructive",
      })
      // Reload plans to revert to database state
      loadSettings()
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to localStorage for now
      // In production, you'd save to a database table
      localStorage.setItem('admin_settings', JSON.stringify(settings))

      toast({
        title: "Success",
        description: "System settings saved successfully",
        // @ts-ignore
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingPage text="Loading settings..." />
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/admin')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          System Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic application configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app_name">Application Name</Label>
              <Input
                id="app_name"
                value={settings.app_name}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                placeholder="GetInvoice"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support_email">Support Email</Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                placeholder="support@getinvoice.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_currency">Default Currency</Label>
              <Select
                value={settings.default_currency}
                onValueChange={(value) => setSettings({ ...settings, default_currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* User Registration */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Settings</CardTitle>
            <CardDescription>Control user registration and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow New Registrations</Label>
                <p className="text-sm text-gray-600">Enable or disable new user sign-ups</p>
              </div>
              <Button
                variant={settings.allow_registration ? "default" : "outline"}
                onClick={() => setSettings({ ...settings, allow_registration: !settings.allow_registration })}
              >
                {settings.allow_registration ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Toggles</CardTitle>
            <CardDescription>Enable or disable system features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Stripe Payments</Label>
                <p className="text-sm text-gray-600">Enable Stripe payment integration</p>
              </div>
              <Button
                variant={settings.stripe_enabled ? "default" : "outline"}
                onClick={() => setSettings({ ...settings, stripe_enabled: !settings.stripe_enabled })}
              >
                {settings.stripe_enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">Send email notifications to users</p>
              </div>
              <Button
                variant={settings.email_notifications_enabled ? "default" : "outline"}
                onClick={() => setSettings({ ...settings, email_notifications_enabled: !settings.email_notifications_enabled })}
              >
                {settings.email_notifications_enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle>AI Cost Forecast Settings</CardTitle>
            <CardDescription>Customize the AI prompt and request limits for cost forecasting assistant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai_request_limit">Daily Request Limit (Free Users)</Label>
              <Input
                id="ai_request_limit"
                type="number"
                min="1"
                max="100"
                value={settings.ai_request_limit_free}
                onChange={(e) => setSettings({ ...settings, ai_request_limit_free: parseInt(e.target.value) || 5 })}
                placeholder="5"
              />
              <p className="text-xs text-gray-500">
                Maximum number of AI cost-forecast requests per day for free tier users. Paid users have unlimited access.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai_prompt">System Prompt</Label>
              <Textarea
                id="ai_prompt"
                value={settings.ai_cost_forecast_prompt}
                onChange={(e) => setSettings({ ...settings, ai_cost_forecast_prompt: e.target.value })}
                placeholder="Enter the AI system prompt..."
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                This prompt controls how the AI analyzes products and generates cost forecasts. Include instructions for output format, pricing calculations, and any specific requirements.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const defaultPrompt = `You are an AI cost-forecast assistant for a food & product pricing system.
When the user gives you a product name (for example "Karipap", "Nasi Lemak Ayam", "Iced Latte", etc.), your job is to:
1. Guess the most common recipe or composition for that product in Malaysia.
2. List all typical ingredients/components used to produce ONE UNIT of that product (one piece, one cup, one plate, etc.).
3. For each ingredient, estimate:
   - quantity per unit
   - unit of measurement (g, ml, pcs, tbsp, etc.)
   - price per unit in Malaysian Ringgit (RM)
   - cost used for one unit of product
4. Calculate:
   - total ingredient cost per unit
   - recommended selling price per unit (include a reasonable profit margin, for example 40–60%)
   - profit per unit and profit margin (%)

Make reasonable assumptions and clearly show them in an "Assumptions" section.

OUTPUT REQUIREMENTS:
- Currency must be in RM with 2 decimal places.
- If the user language is Malay, answer in Malay. If English, answer in English.
- Always provide:
  * A short description of the product
  * A clear ingredient cost table
  * A pricing summary
  * A final JSON block for system integration

The JSON must follow this structure exactly:
{
  "product_name": "...",
  "serving_unit": "...",
  "ingredients": [
    {
      "name": "...",
      "quantity": number,
      "unit": "...",
      "unit_price_rm": number,
      "cost_per_unit_rm": number
    }
  ],
  "total_cost_per_unit_rm": number,
  "suggested_selling_price_rm": number,
  "profit_per_unit_rm": number,
  "profit_margin_percent": number,
  "assumptions": [
    "..."
  ]
}

Do NOT add any extra fields in the JSON.
If the product is too generic or ambiguous, ask the user 1–2 short clarification questions before calculating.`
                  setSettings({ ...settings, ai_cost_forecast_prompt: defaultPrompt })
                }}
                className="text-xs"
              >
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Manage pricing and limits for each subscription tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {plans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <span className="text-sm text-gray-600 capitalize">{plan.tier}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`price-${plan.id}`}>Price (MYR)</Label>
                    <Input
                      id={`price-${plan.id}`}
                      type="number"
                      step="0.01"
                      key={`price-${plan.id}-${plan.price}`}
                      defaultValue={plan.price}
                      onBlur={(e) => {
                        const newPrice = parseFloat(e.target.value)
                        if (!isNaN(newPrice) && newPrice !== plan.price) {
                          updatePlan(plan.id, { price: newPrice })
                        }
                      }}
                      min="0"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`billing-${plan.id}`}>Billing Period</Label>
                    <Select
                      value={plan.billing_period}
                      onValueChange={(value) => updatePlan(plan.id, { billing_period: value as 'monthly' | 'yearly' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`customers-${plan.id}`}>Max Customers</Label>
                    <Input
                      id={`customers-${plan.id}`}
                      type="number"
                      key={`customers-${plan.id}-${plan.max_customers}`}
                      defaultValue={plan.max_customers}
                      onBlur={(e) => {
                        const newValue = parseInt(e.target.value)
                        if (!isNaN(newValue) && newValue !== plan.max_customers) {
                          updatePlan(plan.id, { max_customers: newValue })
                        }
                      }}
                      placeholder="-1 for unlimited"
                    />
                    <p className="text-xs text-gray-500">Use -1 for unlimited</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`invoices-${plan.id}`}>Max Invoices/Month</Label>
                    <Input
                      id={`invoices-${plan.id}`}
                      type="number"
                      key={`invoices-${plan.id}-${plan.max_invoices_per_month}`}
                      defaultValue={plan.max_invoices_per_month}
                      onBlur={(e) => {
                        const newValue = parseInt(e.target.value)
                        if (!isNaN(newValue) && newValue !== plan.max_invoices_per_month) {
                          updatePlan(plan.id, { max_invoices_per_month: newValue })
                        }
                      }}
                      placeholder="-1 for unlimited"
                    />
                    <p className="text-xs text-gray-500">Use -1 for unlimited</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
