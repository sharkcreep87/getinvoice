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
import { useToast } from "@/components/ui/use-toast"
import { LoadingPage } from "@/components/ui/loading"

type SystemSettings = {
  id?: string
  app_name: string
  support_email: string
  default_currency: string
  allow_registration: boolean
  max_free_invoices: number
  max_free_customers: number
  stripe_enabled: boolean
  email_notifications_enabled: boolean
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
    max_free_invoices: 10,
    max_free_customers: 5,
    stripe_enabled: false,
    email_notifications_enabled: true,
  })
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
        .single()

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
      // For now, we'll store settings in localStorage
      // In production, you'd want to store this in a database table
      const savedSettings = localStorage.getItem('admin_settings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error: any) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
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
          <Settings className="h-8 w-8 text-blue-600" />
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

            <div className="space-y-2">
              <Label htmlFor="max_free_invoices">Max Free Invoices per Month</Label>
              <Input
                id="max_free_invoices"
                type="number"
                value={settings.max_free_invoices}
                onChange={(e) => setSettings({ ...settings, max_free_invoices: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_free_customers">Max Free Customers</Label>
              <Input
                id="max_free_customers"
                type="number"
                value={settings.max_free_customers}
                onChange={(e) => setSettings({ ...settings, max_free_customers: parseInt(e.target.value) })}
              />
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
