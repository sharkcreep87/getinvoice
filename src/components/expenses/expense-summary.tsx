'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Tag, FileText } from "lucide-react"

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

type ExpenseSummaryProps = {
  expenses: ExpenseWithCategory[]
}

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  // Calculate metrics
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Filter expenses for current month
  const monthlyExpenses = expenses.filter(exp => {
    const expenseDate = new Date(exp.expense_date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })

  // Calculate totals
  const totalMonthly = monthlyExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const totalAllTime = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

  // Find top category (by total amount)
  const categoryTotals = new Map<string, { name: string; total: number }>()
  expenses.forEach(exp => {
    const existing = categoryTotals.get(exp.category_id)
    if (existing) {
      existing.total += Number(exp.amount)
    } else {
      categoryTotals.set(exp.category_id, {
        name: exp.category.name,
        total: Number(exp.amount)
      })
    }
  })

  let topCategory = "N/A"
  let topCategoryAmount = 0
  categoryTotals.forEach(({ name, total }) => {
    if (total > topCategoryAmount) {
      topCategoryAmount = total
      topCategory = name
    }
  })

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`
  }

  const summaryCards = [
    {
      title: "This Month",
      value: formatCurrency(totalMonthly),
      description: `${monthlyExpenses.length} expense${monthlyExpenses.length !== 1 ? 's' : ''}`,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "All Time",
      value: formatCurrency(totalAllTime),
      description: `${expenses.length} total expense${expenses.length !== 1 ? 's' : ''}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Top Category",
      value: topCategory,
      description: topCategoryAmount > 0 ? formatCurrency(topCategoryAmount) : "No expenses yet",
      icon: Tag,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Expenses",
      value: expenses.length.toString(),
      description: `${monthlyExpenses.length} this month`,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 truncate">
              {card.value}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
