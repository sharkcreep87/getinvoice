'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Building2, Save } from "lucide-react"
import Image from "next/image"
import { LoadingPage } from "@/components/ui/loading"

export default function CompanySettingsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [companySettings, setCompanySettings] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    company_city: "",
    company_state: "",
    company_zip: "",
    company_country: "",
    company_logo_url: "",
    tax_id: "",
    invoice_terms: "",
    invoice_footer: "",
  })

  useEffect(() => {
    loadCompanySettings()
  }, [])

  const loadCompanySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const result = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const data = result.data as any

      if (data) {
        setCompanySettings(data)
        setLogoPreview(data.company_logo_url)
      }
    } catch (error: any) {
      // Settings don't exist yet, that's okay
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `company-logos/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath)

      setLogoPreview(publicUrl)
      setCompanySettings(prev => ({ ...prev, company_logo_url: publicUrl }))

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      setLoading(true)

      // Check if settings exist
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // Update existing settings
        const { error } = await (supabase as any)
          .from('company_settings')
          .update({
            ...companySettings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Create new settings
        const { error } = await (supabase as any)
          .from('company_settings')
          .insert({
            ...companySettings,
            user_id: user.id,
          })

        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Company settings saved successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading && !companySettings.company_name) {
    return <LoadingPage text="Loading company settings..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Company Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize your company details and invoice appearance
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Logo */}
        <Card className="md:col-span-2 border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Company Logo
            </CardTitle>
            <CardDescription>
              Upload your company logo (max 2MB, recommended: 200x200px)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative w-32 h-32 rounded-lg border-2 border-primary/30 overflow-hidden bg-white">
                    <Image
                      src={logoPreview}
                      alt="Company Logo"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center bg-secondary/50">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 hover:border-primary/50 transition-colors hover:bg-accent/50">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        {uploading ? "Uploading..." : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG or SVG up to 2MB
                      </p>
                    </div>
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic company details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={companySettings.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                placeholder="Your Company Inc."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                value={companySettings.company_email}
                onChange={(e) => handleChange('company_email', e.target.value)}
                placeholder="info@company.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="company_phone">Phone Number</Label>
              <Input
                id="company_phone"
                type="tel"
                value={companySettings.company_phone}
                onChange={(e) => handleChange('company_phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
              <Input
                id="tax_id"
                value={companySettings.tax_id}
                onChange={(e) => handleChange('tax_id', e.target.value)}
                placeholder="12-3456789"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Address */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
            <CardTitle>Company Address</CardTitle>
            <CardDescription>Will appear on invoices</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="company_address">Street Address</Label>
              <Input
                id="company_address"
                value={companySettings.company_address}
                onChange={(e) => handleChange('company_address', e.target.value)}
                placeholder="123 Business St."
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_city">City</Label>
                <Input
                  id="company_city"
                  value={companySettings.company_city}
                  onChange={(e) => handleChange('company_city', e.target.value)}
                  placeholder="New York"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="company_state">State</Label>
                <Input
                  id="company_state"
                  value={companySettings.company_state}
                  onChange={(e) => handleChange('company_state', e.target.value)}
                  placeholder="NY"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_zip">ZIP Code</Label>
                <Input
                  id="company_zip"
                  value={companySettings.company_zip}
                  onChange={(e) => handleChange('company_zip', e.target.value)}
                  placeholder="10001"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="company_country">Country</Label>
                <Input
                  id="company_country"
                  value={companySettings.company_country}
                  onChange={(e) => handleChange('company_country', e.target.value)}
                  placeholder="United States"
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Customization */}
        <Card className="md:col-span-2 border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
            <CardTitle>Invoice Customization</CardTitle>
            <CardDescription>
              Customize the terms and footer that appear on your invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="invoice_terms">Terms & Conditions</Label>
              <Textarea
                id="invoice_terms"
                value={companySettings.invoice_terms}
                onChange={(e) => handleChange('invoice_terms', e.target.value)}
                placeholder="Payment is due within 30 days. Late payments may incur fees..."
                className="mt-1.5 min-h-[120px]"
              />
            </div>
            <div>
              <Label htmlFor="invoice_footer">Invoice Footer</Label>
              <Textarea
                id="invoice_footer"
                value={companySettings.invoice_footer}
                onChange={(e) => handleChange('invoice_footer', e.target.value)}
                placeholder="Thank you for your business!"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
