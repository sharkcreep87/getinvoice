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
    invoice_template: "classic",
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
        .select('company_name, company_email, company_phone, company_address, company_city, company_state, company_zip, company_country, company_logo_url, tax_id, invoice_terms, invoice_footer, invoice_template')
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
        <Button
          onClick={handleSave}
          disabled={loading}
          size="lg"
          className="gap-2 bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
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

        {/* Invoice Template Selection */}
        <Card className="md:col-span-2 border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
            <CardTitle>Invoice Template</CardTitle>
            <CardDescription>
              Choose a template design for your invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Classic Template */}
              <div
                onClick={() => handleChange('invoice_template', 'classic')}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg ${
                  companySettings.invoice_template === 'classic'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <div className="aspect-[8.5/11] rounded-md bg-white border border-gray-200 shadow-sm mb-3 overflow-hidden">
                  <div className="h-full p-2 text-[4px] text-gray-700">
                    <div className="flex justify-between mb-1">
                      <div className="w-6 h-2 bg-gray-300 rounded"></div>
                      <div className="text-right">
                        <div className="font-bold text-indigo-600 text-[6px]">INVOICE</div>
                        <div className="h-[2px] bg-indigo-600 w-6 ml-auto"></div>
                      </div>
                    </div>
                    <div className="space-y-[2px] mb-2">
                      <div className="h-[2px] bg-gray-200 w-8"></div>
                      <div className="h-[2px] bg-gray-200 w-6"></div>
                    </div>
                    <div className="h-8 bg-indigo-100 rounded mb-1"></div>
                    <div className="h-6 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm mb-1">Classic</h3>
                  <p className="text-xs text-muted-foreground">
                    Professional indigo theme with clean lines
                  </p>
                </div>
                {companySettings.invoice_template === 'classic' && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-primary">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Selected
                  </div>
                )}
              </div>

              {/* Modern Template */}
              <div
                onClick={() => handleChange('invoice_template', 'modern')}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg ${
                  companySettings.invoice_template === 'modern'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <div className="aspect-[8.5/11] rounded-md bg-white border border-gray-200 shadow-sm mb-3 overflow-hidden">
                  <div className="h-full text-[4px]">
                    <div className="h-4 bg-gradient-to-r from-indigo-500 to-purple-500 p-1 flex justify-between items-center">
                      <div className="w-4 h-2 bg-white rounded-full"></div>
                      <div className="text-white font-bold text-[5px]">INVOICE</div>
                    </div>
                    <div className="p-2">
                      <div className="grid grid-cols-2 gap-1 mb-1">
                        <div className="h-4 bg-gray-100 rounded border border-gray-200"></div>
                        <div className="h-4 bg-gray-100 rounded border border-gray-200"></div>
                      </div>
                      <div className="flex gap-1 mb-1">
                        <div className="flex-1 h-2 bg-cyan-50 rounded border border-cyan-200"></div>
                        <div className="flex-1 h-2 bg-yellow-50 rounded border border-yellow-200"></div>
                        <div className="flex-1 h-2 bg-green-50 rounded border border-green-200"></div>
                      </div>
                      <div className="h-6 bg-gray-50 rounded mb-1"></div>
                      <div className="h-3 bg-indigo-500 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm mb-1">Modern</h3>
                  <p className="text-xs text-muted-foreground">
                    Bold design with colorful accents
                  </p>
                </div>
                {companySettings.invoice_template === 'modern' && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-primary">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Selected
                  </div>
                )}
              </div>

              {/* Minimal Template */}
              <div
                onClick={() => handleChange('invoice_template', 'minimal')}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg ${
                  companySettings.invoice_template === 'minimal'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <div className="aspect-[8.5/11] rounded-md bg-white border border-gray-200 shadow-sm mb-3 overflow-hidden">
                  <div className="h-full p-2 text-[4px]">
                    <div className="border-t-2 border-black mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="font-bold text-[7px]">Invoice</div>
                      <div className="h-[2px] bg-gray-300 w-4"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="space-y-[2px]">
                        <div className="h-[2px] bg-gray-200 w-3"></div>
                        <div className="h-[2px] bg-gray-200 w-6"></div>
                      </div>
                      <div className="space-y-[2px]">
                        <div className="h-[2px] bg-gray-200 w-3"></div>
                        <div className="h-[2px] bg-gray-200 w-6"></div>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 mb-1"></div>
                    <div className="h-6 bg-white mb-1"></div>
                    <div className="border-t border-gray-200 mb-1"></div>
                    <div className="space-y-[2px] ml-auto w-8">
                      <div className="h-[2px] bg-gray-200"></div>
                      <div className="h-[2px] bg-black"></div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm mb-1">Minimal</h3>
                  <p className="text-xs text-muted-foreground">
                    Clean and simple with elegant spacing
                  </p>
                </div>
                {companySettings.invoice_template === 'minimal' && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-primary">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Selected
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
