'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
        setSettings(JSON.parse(savedSettings))
      }

      // Load subscription plans from database
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
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
      const { error } = await (supabase as any)
        .from('subscription_plans')
        .update(updates as any)
        .eq('id', planId)

      if (error) throw error

      // Update local state — cast because DB Update type can be slightly different from the local SubscriptionPlan type
      setPlans(plans.map(p => p.id === planId ? { ...p, ...(updates as Partial<SubscriptionPlan>) } : p))

      toast({
        title: "Success",
        description: "Subscription plan updated",
        // @ts-ignore
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update plan",
        variant: "destructive",
      })
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
                      value={plan.price}
                      onChange={(e) => updatePlan(plan.id, { price: parseFloat(e.target.value) })}
                      min="0"
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
                      value={plan.max_customers}
                      onChange={(e) => updatePlan(plan.id, { max_customers: parseInt(e.target.value) })}
                      placeholder="-1 for unlimited"
                    />
                    <p className="text-xs text-gray-500">Use -1 for unlimited</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`invoices-${plan.id}`}>Max Invoices/Month</Label>
                    <Input
                      id={`invoices-${plan.id}`}
                      type="number"
                      value={plan.max_invoices_per_month}
                      onChange={(e) => updatePlan(plan.id, { max_invoices_per_month: parseInt(e.target.value) })}
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
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
