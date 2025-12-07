'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { ReceiptScanner } from "./receipt-scanner"

type ExpenseCategory = {
  id: string
  name: string
  is_predefined: boolean
}

type Expense = {
  id: string
  category_id: string
  description: string
  amount: number
  expense_date: string
  vendor: string | null
  receipt_url: string | null
  notes: string | null
}

type ExpenseFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingExpense: Expense | null
  categories: ExpenseCategory[]
  onSuccess: () => void
}

export function ExpenseForm({
  open,
  onOpenChange,
  editingExpense,
  categories,
  onSuccess,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category_id: "",
    expense_date: new Date().toISOString().split('T')[0], // Today's date
    vendor: "",
    notes: "",
  })
  const [receiptUrl, setReceiptUrl] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Initialize form when editing or reset when creating new
  useEffect(() => {
    if (editingExpense) {
      setFormData({
        description: editingExpense.description,
        amount: editingExpense.amount.toString(),
        category_id: editingExpense.category_id,
        expense_date: editingExpense.expense_date,
        vendor: editingExpense.vendor || "",
        notes: editingExpense.notes || "",
      })
      setReceiptUrl(editingExpense.receipt_url || "")
    } else {
      resetForm()
    }
  }, [editingExpense, open])

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category_id: "",
      expense_date: new Date().toISOString().split('T')[0],
      vendor: "",
      notes: "",
    })
    setReceiptUrl("")
  }

  const handleScanComplete = (
    data: {
      vendor: string
      amount: number
      date: string
      description: string
      suggested_category: string
    },
    scannedReceiptUrl: string
  ) => {
    // Auto-fill form with scanned data
    setFormData({
      ...formData,
      description: data.description || formData.description,
      amount: data.amount ? data.amount.toString() : formData.amount,
      expense_date: data.date || formData.expense_date,
      vendor: data.vendor || formData.vendor,
    })
    setReceiptUrl(scannedReceiptUrl)

    // Try to match suggested category
    if (data.suggested_category) {
      const matchedCategory = categories.find(
        cat => cat.name.toLowerCase() === data.suggested_category.toLowerCase()
      )
      if (matchedCategory) {
        setFormData(prev => ({ ...prev, category_id: matchedCategory.id }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Validate amount
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount < 0) {
        throw new Error("Please enter a valid positive amount")
      }

      const expenseData = {
        description: formData.description.trim(),
        amount: amount,
        category_id: formData.category_id,
        expense_date: formData.expense_date,
        vendor: formData.vendor.trim() || null,
        notes: formData.notes.trim() || null,
        receipt_url: receiptUrl || null,
      }

      if (editingExpense) {
        // Update existing expense
        const { error } = await (supabase as any)
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Expense updated successfully",
        })
      } else {
        // Create new expense
        const { error } = await (supabase as any)
          .from('expenses')
          .insert({
            ...expenseData,
            user_id: user.id,
          })

        if (error) throw error

        toast({
          title: "Success",
          description: "Expense created successfully",
        })
      }

      onOpenChange(false)
      resetForm()
      onSuccess()
    } catch (error: any) {
      console.error('Expense save error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save expense",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingExpense ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
          <DialogDescription>
            {editingExpense
              ? "Update the expense details below"
              : "Fill in the expense information or scan a receipt to auto-fill"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Receipt Scanner - Only show when creating new expense */}
            {!editingExpense && (
              <div className="space-y-2">
                <Label>Receipt (Optional)</Label>
                <ReceiptScanner
                  onScanComplete={handleScanComplete}
                  disabled={submitting}
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Office supplies for Q4"
                required
                disabled={submitting}
              />
            </div>

            {/* Amount and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (RM) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  disabled={submitting}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        {!category.is_predefined && " (Custom)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Vendor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense_date">Date *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="e.g., Stationery Shop"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes (optional)"
                rows={3}
                disabled={submitting}
              />
            </div>

            {/* Show receipt URL if available */}
            {receiptUrl && (
              <div className="space-y-2">
                <Label>Attached Receipt</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-600 truncate flex-1">
                    Receipt uploaded
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(receiptUrl, '_blank')}
                  >
                    View
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingExpense ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
