'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Download, Eye, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { generateInvoiceNumber, formatCurrency } from "@/lib/utils"
import { generateInvoicePDF } from "@/lib/invoice-pdf"

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
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unit_price: 0, amount: 0 },
  ])
  const [formData, setFormData] = useState({
    customer_id: "",
    status: "draft" as const,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax_rate: 0,
    discount_amount: 0,
    notes: "",
    terms: "Payment is due within 30 days",
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [invoicesResult, customersResult] = await Promise.all([
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
      ])

      if (invoicesResult.error) throw invoicesResult.error
      if (customersResult.error) throw customersResult.error

      setInvoices(invoicesResult.data || [])
      setCustomers(customersResult.data || [])
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

      const { data: invoice, error: invoiceError } = await supabase
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
          notes: formData.notes,
          terms: formData.terms,
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const { error: itemsError } = await supabase
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
      resetForm()
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (!customer || !invoiceItems) throw new Error("Failed to load invoice data")

      const invoiceData = {
        ...invoice,
        customer,
        items: invoiceItems,
      }

      const companyInfo = {
        name: profile?.full_name || 'Your Company',
        email: profile?.email || '',
      }

      const pdf = generateInvoicePDF(invoiceData, companyInfo)
      pdf.save(`invoice-${invoice.invoice_number}.pdf`)

      toast({
        title: "Success",
        description: "Invoice PDF downloaded",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
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
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
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
          <DialogTrigger asChild>
            <Button disabled={customers.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </DialogTrigger>
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
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{formatCurrency(formData.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({formData.tax_rate}%):</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
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
                <Button onClick={() => setDialogOpen(true)}>
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
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
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
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPDF(invoice)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(invoice.id)}
                          title="Delete"
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
    </div>
  )
}
