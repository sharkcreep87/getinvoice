'use client'

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Download, Eye, Trash2, Edit, Share2, MoreVertical } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { generateInvoiceNumber, formatCurrency } from "@/lib/utils"
import { generateInvoicePDF } from "@/lib/invoice-pdf"
import { sharePDF, canSharePDF } from "@/lib/share-pdf"
import { LoadingPage } from "@/components/ui/loading"

type Invoice = {
  id: string
  invoice_number: string
  customer_id: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total: number
  currency?: string
  notes: string | null
  terms: string | null
  created_at: string
}

type Customer = {
  id: string
  name: string
  email: string
  company: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

type InvoiceItem = {
  id?: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [checkModalOpen, setCheckModalOpen] = useState(false)
  const [missingCompany, setMissingCompany] = useState(false)
  const [missingCustomers, setMissingCustomers] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [userCurrency, setUserCurrency] = useState<string>('MYR')
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unit_price: 0, amount: 0 },
  ])
  const [formData, setFormData] = useState<{
    customer_id: string
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
    issue_date: string
    due_date: string
    tax_rate: number
    discount_amount: number
    notes: string
    terms: string
  }>({
    customer_id: "",
    status: "draft",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax_rate: 0,
    discount_amount: 0,
    notes: "",
    terms: "Payment is due within 30 days",
  })
  const { toast } = useToast()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    loadData()
    loadUserCurrency()
    // if ?view=<invoice_id> present we open that invoice automatically
    const viewId = searchParams.get('view')
    if (viewId) {
      // fetch invoice by id and open view dialog
      ;(async () => {
        try {
          const { data: invoiceData } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', viewId)
            .single()

          if (!invoiceData) return

          const { data: invoiceItems } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', viewId)

          // invoiceData can be unknown/never in TS inference here — cast safely to any
          const inv: any = invoiceData
          const { data: customer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', inv.customer_id)
            .single()

          setSelectedInvoice({ ...(inv as any), customer, items: invoiceItems })
          setViewDialogOpen(true)
        } catch (err) {
          console.error('Failed to open invoice from URL param', err)
        }
      })()
    }
  }, [])

  // clear the query param when the dialog is closed
  useEffect(() => {
    if (!viewDialogOpen) {
      const viewId = searchParams.get('view')
      if (viewId) {
        // replace URL without the view param
        router.replace('/dashboard/invoices')
      }
    }
  }, [viewDialogOpen])

  const loadUserCurrency = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('currency')
        .eq('id', user.id)
        .single()

      if ((profile as any)?.currency) {
        setUserCurrency((profile as any).currency)
      }
    } catch (error) {
      console.error('Error loading currency:', error)
    }
  }

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [invoicesResult, customersResult, profileResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('profiles')
          .select('currency')
          .eq('id', user.id)
          .single(),
      ])

      if (invoicesResult.error) throw invoicesResult.error
      if (customersResult.error) throw customersResult.error

      setInvoices(invoicesResult.data || [])
      setCustomers(customersResult.data || [])
      setUserCurrency((profileResult.data as any)?.currency || 'MYR')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Verify company & customers exist before opening the "Create Invoice" dialog
  const checkBeforeCreate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: 'Not authenticated', description: 'Please login to continue', variant: 'destructive' })
        return
      }

      // customers are loaded into state already
      const hasCustomers = customers.length > 0

      // check for company settings
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('id, company_name')
        .eq('user_id', user.id)
        .single()

      const hasCompany = !!companySettings

      if (!hasCompany || !hasCustomers) {
        setMissingCompany(!hasCompany)
        setMissingCustomers(!hasCustomers)
        setCheckModalOpen(true)
        return
      }

      // All good — open the create dialog
      setDialogOpen(true)
    } catch (error: any) {
      console.error('Error checking prerequisites for creating invoice', error)
      toast({ title: 'Error', description: error.message || 'Failed to check prerequisites', variant: 'destructive' })
    }
  }

  const goToCompany = () => {
    setCheckModalOpen(false)
    router.push('/dashboard/company')
  }

  const goToCustomers = () => {
    setCheckModalOpen(false)
    router.push('/dashboard/customers')
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = (subtotal - formData.discount_amount) * (formData.tax_rate / 100)
    const total = subtotal - formData.discount_amount + taxAmount
    return { subtotal, taxAmount, total }
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price
    }

    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, amount: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customer_id) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      })
      return
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.unit_price < 0)) {
      toast({
        title: "Error",
        description: "Please fill in all item details correctly",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { subtotal, taxAmount, total } = calculateTotals()

      if (editingInvoiceId) {
        // Update existing invoice
        const { error: invoiceError } = await (supabase as any)
          .from('invoices')
          .update({
            customer_id: formData.customer_id,
            status: formData.status,
            issue_date: formData.issue_date,
            due_date: formData.due_date,
            subtotal,
            tax_rate: formData.tax_rate,
            tax_amount: taxAmount,
            discount_amount: formData.discount_amount,
            total,
            currency: userCurrency,
            notes: formData.notes,
            terms: formData.terms,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingInvoiceId)

        if (invoiceError) throw invoiceError

        // Delete existing items
        const { error: deleteItemsError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', editingInvoiceId)

        if (deleteItemsError) throw deleteItemsError

        // Insert new items
        const { error: itemsError } = await (supabase as any)
          .from('invoice_items')
          .insert(
            items.map(item => ({
              invoice_id: editingInvoiceId,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.amount,
            }))
          )

        if (itemsError) throw itemsError

        toast({
          title: "Success",
          description: "Invoice updated successfully",
        })

        setEditDialogOpen(false)
      } else {
        // Create new invoice
        const { data: invoice, error: invoiceError } = await (supabase as any)
          .from('invoices')
          .insert({
            user_id: user.id,
            customer_id: formData.customer_id,
            invoice_number: generateInvoiceNumber(),
            status: formData.status,
            issue_date: formData.issue_date,
            due_date: formData.due_date,
            subtotal,
            tax_rate: formData.tax_rate,
            tax_amount: taxAmount,
            discount_amount: formData.discount_amount,
            total,
            currency: userCurrency,
            notes: formData.notes,
            terms: formData.terms,
          })
          .select()
          .single()

        if (invoiceError) throw invoiceError

        const { error: itemsError } = await (supabase as any)
          .from('invoice_items')
          .insert(
            items.map(item => ({
              invoice_id: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.amount,
            }))
          )

        if (itemsError) throw itemsError

        toast({
          title: "Success",
          description: "Invoice created successfully",
        })

        setDialogOpen(false)
      }

      resetForm()
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingInvoiceId ? 'update' : 'create'} invoice`,
        variant: "destructive",
      })
    }
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', invoice.customer_id)
        .single()

      const { data: invoiceItems } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const profile = profileResult.data as any

      // Fetch company settings
      const companySettingsResult = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const companySettings = companySettingsResult.data as any

      if (!customer || !invoiceItems) throw new Error("Failed to load invoice data")

      const invoiceData = {
        ...invoice,
        customer,
        items: invoiceItems,
      }

      // Use company settings if available, fallback to profile
      const companyInfo = {
        name: profile?.full_name || 'Your Company',
        email: profile?.email || '',
        company_name: companySettings?.company_name,
        company_email: companySettings?.company_email,
        company_phone: companySettings?.company_phone,
        company_address: companySettings?.company_address,
        company_city: companySettings?.company_city,
        company_state: companySettings?.company_state,
        company_zip: companySettings?.company_zip,
        company_country: companySettings?.company_country,
        company_logo_url: companySettings?.company_logo_url,
        tax_id: companySettings?.tax_id,
        invoice_terms: companySettings?.invoice_terms,
        invoice_footer: companySettings?.invoice_footer,
      }

      const pdf = await generateInvoicePDF(invoiceData, companyInfo, userCurrency)

      // Add timestamp to filename to avoid browser appending (1), (2) after .pdf
      const timestamp = new Date().getTime()
      const filename = `invoice-${invoice.invoice_number}-${timestamp}.pdf`

      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      if (isMobile) {
        // For all mobile devices: Open PDF in new tab
        // Mobile browsers handle downloads better this way
        const pdfBlob = pdf.output('blob')
        const pdfUrl = URL.createObjectURL(pdfBlob)

        const newWindow = window.open(pdfUrl, '_blank')

        if (newWindow) {
          toast({
            title: "PDF Opened",
            description: "Use your browser menu to download or share",
            // @ts-ignore
            variant: "success",
          })
        } else {
          // If popup blocked, navigate to PDF
          window.location.href = pdfUrl
          toast({
            title: "PDF Ready",
            description: "PDF is loading...",
            // @ts-ignore
            variant: "success",
          })
        }

        // Clean up URL after delay
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 2000)
      } else {
        // For desktop, use normal download
        pdf.save(filename)

        toast({
          title: "Success",
          description: "Invoice PDF downloaded",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      })
    }
  }

  const handleSharePDF = async (invoice: Invoice) => {
    try {
      // Check if sharing is supported
      if (!canSharePDF()) {
        toast({
          title: "Not Supported",
          description: "PDF sharing is not supported on this device. Try downloading instead.",
          variant: "destructive",
        })
        return
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', invoice.customer_id)
        .single()

      const { data: invoiceItems } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const profile = profileResult.data as any

      // Fetch company settings
      const companySettingsResult = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const companySettings = companySettingsResult.data as any

      if (!customer || !invoiceItems) throw new Error("Failed to load invoice data")

      const invoiceData = {
        ...invoice,
        customer,
        items: invoiceItems,
      }

      // Use company settings if available, fallback to profile
      const companyInfo = {
        name: profile?.full_name || 'Your Company',
        email: profile?.email || '',
        company_name: companySettings?.company_name,
        company_email: companySettings?.company_email,
        company_phone: companySettings?.company_phone,
        company_address: companySettings?.company_address,
        company_city: companySettings?.company_city,
        company_state: companySettings?.company_state,
        company_zip: companySettings?.company_zip,
        company_country: companySettings?.company_country,
        company_logo_url: companySettings?.company_logo_url,
        tax_id: companySettings?.tax_id,
        invoice_terms: companySettings?.invoice_terms,
        invoice_footer: companySettings?.invoice_footer,
      }

      const pdf = await generateInvoicePDF(invoiceData, companyInfo, userCurrency)
      await sharePDF(pdf, `invoice-${invoice.invoice_number}.pdf`)

      toast({
        title: "Success",
        description: "Invoice PDF shared successfully",
        // @ts-ignore - success variant added to toast component
        variant: "success",
      })
    } catch (error: any) {
      // Don't show error if user cancelled the share
      if (error.message === 'Share cancelled') {
        return
      }

      toast({
        title: "Error",
        description: error.message || "Failed to share PDF",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return

    try {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id)

      if (itemsError) throw itemsError

      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (invoiceError) throw invoiceError

      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      })
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      })
    }
  }

  const handleView = async (invoice: Invoice) => {
    try {
      const { data: invoiceItems } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)

      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', invoice.customer_id)
        .single()

      if (invoiceItems && customer) {
        setSelectedInvoice({
          ...invoice,
          customer,
          items: invoiceItems,
        } as any)
        setViewDialogOpen(true)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load invoice details",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (invoice: Invoice) => {
    try {
      const { data: invoiceItems } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)

      if (invoiceItems) {
        setEditingInvoiceId(invoice.id)
        setFormData({
          customer_id: invoice.customer_id,
          status: invoice.status,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          tax_rate: invoice.tax_rate,
          discount_amount: invoice.discount_amount,
          notes: invoice.notes || "",
          terms: invoice.terms || "",
        })
        setItems((invoiceItems as any).map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        })))
        setEditDialogOpen(true)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load invoice for editing",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      customer_id: "",
      status: "draft",
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tax_rate: 0,
      discount_amount: 0,
      notes: "",
      terms: "Payment is due within 30 days",
    })
    setItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }])
    setEditingInvoiceId(null)
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  if (loading) {
    return <LoadingPage text="Loading invoices..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Create and manage invoices</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
              <Button onClick={checkBeforeCreate}>
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Fill in the invoice details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer *</Label>
                    <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">Issue Date</Label>
                    <Input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5 space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                          required
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="1"
                          required
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Price</Label>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={item.amount}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                    <Input
                      type="number"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount Amount</Label>
                    <Input
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal, userCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{formatCurrency(formData.discount_amount, userCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({formData.tax_rate}%):</span>
                    <span>{formatCurrency(taxAmount, userCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatCurrency(total, userCurrency)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Input
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    placeholder="Payment terms"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Invoice</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Prerequisite check modal — informs user that Company or Customers are missing */}
        <Dialog open={checkModalOpen} onOpenChange={setCheckModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Setup Required</DialogTitle>
              <DialogDescription>
                {missingCompany && missingCustomers && (
                  <span>
                    You need to set up your company details and add at least one customer before creating invoices.
                  </span>
                )}
                {missingCompany && !missingCustomers && (
                  <span>Please set up your company details before creating invoices.</span>
                )}
                {!missingCompany && missingCustomers && (
                  <span>Please add at least one customer before creating invoices.</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end mt-4">
              {missingCompany && (
                <Button variant="outline" onClick={goToCompany}>
                  Create Company
                </Button>
              )}
              {missingCustomers && (
                <Button onClick={goToCustomers}>
                  Add Customer
                </Button>
              )}
              <Button variant="ghost" onClick={() => setCheckModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {customers.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                You need to add customers before creating invoices
              </p>
              <Button onClick={() => window.location.href = '/dashboard/customers'}>
                Go to Customers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No invoices yet</p>
              {customers.length > 0 && (
                <Button onClick={() => checkBeforeCreate()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Invoice
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(invoice.total, invoice.currency || userCurrency)}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Mobile: Show only essential actions */}
                      <div className="flex md:hidden justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(invoice)}
                          className="h-8 px-2"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(invoice)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
                          className="h-8 px-2"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>

                      {/* Desktop: Show all actions */}
                      <div className="hidden md:flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(invoice)}
                          title="View Details"
                          className="shrink-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(invoice)}
                          title="Edit Invoice"
                          className="shrink-0"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        {canSharePDF() && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSharePDF(invoice)}
                            title="Share PDF"
                            className="shrink-0"
                          >
                            <Share2 className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(invoice.id)}
                          title="Delete"
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              View complete invoice information
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-primary/5 to-blue-100 rounded-lg">
                <div>
                  <Label className="text-sm text-muted-foreground">Invoice Number</Label>
                  <p className="font-semibold text-lg">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <p>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        selectedInvoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : selectedInvoice.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedInvoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedInvoice.status.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Issue Date</Label>
                  <p className="font-medium">{new Date(selectedInvoice.issue_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Due Date</Label>
                  <p className="font-medium">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-2 border-primary/20 rounded-lg p-4">
                <Label className="text-sm text-muted-foreground">Customer</Label>
                <p className="font-semibold text-lg">{(selectedInvoice as any).customer?.name}</p>
                <p className="text-sm text-gray-600">{(selectedInvoice as any).customer?.email}</p>
                {(selectedInvoice as any).customer?.company && (
                  <p className="text-sm text-gray-600">{(selectedInvoice as any).customer?.company}</p>
                )}
              </div>

              <div>
                <Label className="text-lg font-semibold mb-3 block">Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedInvoice as any).items?.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price, userCurrency)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.amount, userCurrency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.subtotal, userCurrency)}</span>
                </div>
                {selectedInvoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatCurrency(selectedInvoice.discount_amount, userCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax ({selectedInvoice.tax_rate}%):</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.tax_amount, userCurrency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(selectedInvoice.total, userCurrency)}</span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label className="font-semibold">Notes</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedInvoice.notes}</p>
                </div>
              )}

              {selectedInvoice.terms && (
                <div>
                  <Label className="font-semibold">Terms & Conditions</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedInvoice.terms}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
            {selectedInvoice && (
              <>
                <Button onClick={() => handleDownloadPDF(selectedInvoice)} className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                {canSharePDF() && (
                  <Button onClick={() => handleSharePDF(selectedInvoice)} variant="default" className="w-full sm:w-auto">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share PDF
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update invoice details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={item.amount}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Discount Amount</Label>
                  <Input
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm">Subtotal</Label>
                  <p className="font-semibold">{formatCurrency(subtotal, userCurrency)}</p>
                </div>
                <div>
                  <Label className="text-sm">Tax</Label>
                  <p className="font-semibold">{formatCurrency(taxAmount, userCurrency)}</p>
                </div>
                <div>
                  <Label className="text-sm">Total</Label>
                  <p className="font-bold text-lg text-primary">{formatCurrency(total, userCurrency)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Input
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Payment terms"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
