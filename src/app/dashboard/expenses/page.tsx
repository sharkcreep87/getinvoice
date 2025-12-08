'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Receipt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { AIUsageBadge } from "@/components/ai-usage-badge"
import { LoadingPage } from "@/components/ui/loading"
import { ExpenseSummary } from "@/components/expenses/expense-summary"
import { ExpenseTable } from "@/components/expenses/expense-table"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { CategoryManager } from "@/components/expenses/category-manager"

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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadExpenses(), loadCategories()])
    } finally {
      setLoading(false)
    }
  }

  const loadExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          category_id,
          description,
          amount,
          expense_date,
          vendor,
          receipt_url,
          notes,
          expense_categories (
            id,
            name,
            is_predefined
          )
        `)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false })

      if (error) throw error

      // Transform data to flatten category
      const transformedData = (data || []).map((exp: any) => ({
        id: exp.id,
        category_id: exp.category_id,
        description: exp.description,
        amount: exp.amount,
        expense_date: exp.expense_date,
        vendor: exp.vendor,
        receipt_url: exp.receipt_url,
        notes: exp.notes,
        category: Array.isArray(exp.expense_categories)
          ? exp.expense_categories[0]
          : exp.expense_categories
      }))

      setExpenses(transformedData as ExpenseWithCategory[])
    } catch (error: any) {
      console.error('Load expenses error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load expenses",
        variant: "destructive",
      })
    }
  }

  const loadCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('expense_categories')
        .select('id, name, is_predefined')
        .eq('user_id', user.id)
        .order('is_predefined', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      console.error('Load categories error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load categories",
        variant: "destructive",
      })
    }
  }

  const openAddDialog = () => {
    setEditingExpense(null)
    setDialogOpen(true)
  }

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense)
    setDialogOpen(true)
  }

  const handleFormSuccess = () => {
    loadExpenses()
  }

  const handleCategoriesChange = () => {
    loadCategories()
  }

  // Filter expenses based on search query
  const filteredExpenses = expenses.filter(exp => {
    const query = searchQuery.toLowerCase()
    return (
      exp.description.toLowerCase().includes(query) ||
      exp.category.name.toLowerCase().includes(query) ||
      (exp.vendor && exp.vendor.toLowerCase().includes(query)) ||
      (exp.notes && exp.notes.toLowerCase().includes(query))
    )
  })

  if (loading) {
    return <LoadingPage text="Loading expenses..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses</h1>
            <AIUsageBadge />
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Track and manage your business expenses (AI Receipt Scanning included)
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Tabs for Expenses and Categories */}
      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          {/* Summary Cards */}
          <ExpenseSummary expenses={expenses} />

          {/* Search and Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>All Expenses</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-4">No expenses yet</p>
                  <Button onClick={openAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Expense
                  </Button>
                </div>
              ) : (
                <ExpenseTable
                  expenses={filteredExpenses}
                  onEdit={openEditDialog}
                  onDelete={loadExpenses}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <CategoryManager
                categories={categories}
                onCategoriesChange={handleCategoriesChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Expense Form Dialog */}
      <ExpenseForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingExpense={editingExpense}
        categories={categories}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
