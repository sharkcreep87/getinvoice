import { createClient } from '@/lib/supabase/client'

export type AnalyticsData = {
  // Revenue metrics
  totalRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  revenueGrowth: number // percentage change from last month

  // Invoice metrics
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  averageInvoiceValue: number

  // Expense metrics
  totalExpenses: number
  monthlyExpenses: number
  yearlyExpenses: number

  // Profit metrics
  grossProfit: number
  netProfit: number
  profitMargin: number

  // Customer metrics
  totalCustomers: number
  activeCustomers: number // customers with invoices in last 90 days
  topCustomers: Array<{
    name: string
    totalSpent: number
    invoiceCount: number
  }>

  // Product metrics
  totalProducts: number
  lowStockProducts: number
  topSellingProducts: Array<{
    name: string
    quantitySold: number
    revenue: number
  }>

  // Trends
  revenueByMonth: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
  }>

  invoiceStatusBreakdown: Array<{
    status: string
    count: number
    value: number
  }>
}

export async function getAnalytics(userId: string): Promise<AnalyticsData | null> {
  try {
    const supabase = createClient()

    // Get date ranges
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentYear = new Date(now.getFullYear(), 0, 1)
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const last12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    // Fetch all data in parallel
    const [
      invoicesResult,
      expensesResult,
      customersResult,
      productsResult,
      invoiceItemsResult,
    ] = await Promise.all([
      supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('products')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('invoice_items')
        .select('*, invoices!inner(user_id, status, created_at)')
        .eq('invoices.user_id', userId),
    ])

    const invoices = (invoicesResult.data || []) as any[]
    const expenses = (expensesResult.data || []) as any[]
    const customers = (customersResult.data || []) as any[]
    const products = (productsResult.data || []) as any[]
    const invoiceItems = (invoiceItemsResult.data || []) as any[]

    // Revenue calculations
    const paidInvoices = invoices.filter(inv => inv.status === 'paid')
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)

    const monthlyPaidInvoices = paidInvoices.filter(inv => new Date(inv.created_at) >= currentMonth)
    const monthlyRevenue = monthlyPaidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)

    const lastMonthPaidInvoices = paidInvoices.filter(
      inv => new Date(inv.created_at) >= lastMonth && new Date(inv.created_at) < currentMonth
    )
    const lastMonthRevenue = lastMonthPaidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)

    const yearlyPaidInvoices = paidInvoices.filter(inv => new Date(inv.created_at) >= currentYear)
    const yearlyRevenue = yearlyPaidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)

    const revenueGrowth = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : monthlyRevenue > 0 ? 100 : 0

    // Invoice metrics
    const totalInvoices = invoices.length
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent').length
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length
    const averageInvoiceValue = paidInvoices.length > 0
      ? totalRevenue / paidInvoices.length
      : 0

    // Expense calculations
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const monthlyExpenses = expenses
      .filter(exp => new Date(exp.expense_date) >= currentMonth)
      .reduce((sum, exp) => sum + Number(exp.amount), 0)
    const yearlyExpenses = expenses
      .filter(exp => new Date(exp.expense_date) >= currentYear)
      .reduce((sum, exp) => sum + Number(exp.amount), 0)

    // Profit calculations
    const grossProfit = totalRevenue
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Customer analytics
    const totalCustomers = customers.length
    const recentInvoices = invoices.filter(inv => new Date(inv.created_at) >= last90Days)
    const activeCustomerIds = new Set(recentInvoices.map(inv => inv.customer_id))
    const activeCustomers = activeCustomerIds.size

    // Top customers
    const customerSpending = new Map<string, { name: string; total: number; count: number }>()
    paidInvoices.forEach(inv => {
      const customer = customers.find(c => c.id === inv.customer_id)
      if (customer) {
        const existing = customerSpending.get(inv.customer_id) || { name: customer.name, total: 0, count: 0 }
        customerSpending.set(inv.customer_id, {
          name: customer.name,
          total: existing.total + Number(inv.total),
          count: existing.count + 1,
        })
      }
    })
    const topCustomers = Array.from(customerSpending.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(c => ({ name: c.name, totalSpent: c.total, invoiceCount: c.count }))

    // Product analytics
    const totalProducts = products.length
    const lowStockProducts = products.filter(p => p.stock_quantity !== null && p.stock_quantity <= 10).length

    // Top selling products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()
    const paidInvoiceIds = new Set(paidInvoices.map(inv => inv.id))

    invoiceItems
      .filter(item => paidInvoiceIds.has(item.invoice_id))
      .forEach(item => {
        const product = products.find(p => p.id === item.product_id)
        if (product) {
          const existing = productSales.get(item.product_id) || { name: product.name, quantity: 0, revenue: 0 }
          productSales.set(item.product_id, {
            name: product.name,
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + Number(item.amount),
          })
        }
      })
    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({ name: p.name, quantitySold: p.quantity, revenue: p.revenue }))

    // Revenue by month (last 12 months)
    const revenueByMonth: Array<{ month: string; revenue: number; expenses: number; profit: number }> = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      const monthRevenue = paidInvoices
        .filter(inv => {
          const date = new Date(inv.created_at)
          return date >= monthDate && date < nextMonth
        })
        .reduce((sum, inv) => sum + Number(inv.total), 0)

      const monthExpenses = expenses
        .filter(exp => {
          const date = new Date(exp.expense_date)
          return date >= monthDate && date < nextMonth
        })
        .reduce((sum, exp) => sum + Number(exp.amount), 0)

      revenueByMonth.push({
        month: monthName,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      })
    }

    // Invoice status breakdown
    const statusGroups = invoices.reduce((acc, inv) => {
      const status = inv.status
      if (!acc[status]) {
        acc[status] = { count: 0, value: 0 }
      }
      acc[status].count++
      acc[status].value += Number(inv.total)
      return acc
    }, {} as Record<string, { count: number; value: number }>)

    const invoiceStatusBreakdown = Object.entries(statusGroups).map(([status, data]) => ({
      status,
      count: (data as { count: number; value: number }).count,
      value: (data as { count: number; value: number }).value,
    }))

    return {
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      revenueGrowth,
      totalInvoices,
      paidInvoices: paidInvoices.length,
      pendingInvoices,
      overdueInvoices,
      averageInvoiceValue,
      totalExpenses,
      monthlyExpenses,
      yearlyExpenses,
      grossProfit,
      netProfit,
      profitMargin,
      totalCustomers,
      activeCustomers,
      topCustomers,
      totalProducts,
      lowStockProducts,
      topSellingProducts,
      revenueByMonth,
      invoiceStatusBreakdown,
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return null
  }
}
