'use client'

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, FileText, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

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

type ExpenseWithCategory = Expense & {
  category: ExpenseCategory
}

type ExpenseTableProps = {
  expenses: ExpenseWithCategory[]
  onEdit: (expense: Expense) => void
  onDelete: () => void
}

export function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const handleDelete = async (expense: Expense) => {
    if (!confirm(`Are you sure you want to delete this expense: "${expense.description}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
      onDelete()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 mb-2">No expenses found</p>
        <p className="text-sm text-gray-500">Add your first expense to get started</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Date</TableHead>
              <TableHead className="min-w-[150px]">Description</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Vendor</TableHead>
              <TableHead className="text-right min-w-[100px]">Amount</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Receipt</TableHead>
              <TableHead className="text-right min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {formatDate(expense.expense_date)}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px]">
                    <p className="font-medium truncate">{expense.description}</p>
                    {expense.notes && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {expense.notes}
                      </p>
                    )}
                    {/* Show category on mobile */}
                    <Badge variant="outline" className="md:hidden mt-1 text-xs">
                      {expense.category.name}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">
                    {expense.category.name}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {expense.vendor || "-"}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center">
                  {expense.receipt_url ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(expense.receipt_url!, '_blank')}
                      title="View receipt"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                    </Button>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(expense)}
                      className="h-8 w-8"
                      title="Edit expense"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(expense)}
                      className="h-8 w-8"
                      title="Delete expense"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
