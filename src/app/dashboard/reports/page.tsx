'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { getAnalytics, type AnalyticsData } from '@/lib/analytics'
import { formatCurrency } from '@/lib/utils'
import { LoadingPage } from '@/components/ui/loading'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Users,
  Package,
  AlertCircle,
  BarChart3,
} from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export default function ReportsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [currency, setCurrency] = useState('MYR')

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user currency
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('currency')
        .eq('id', user.id)
        .single()

      if (profile?.currency) {
        setCurrency(profile.currency)
      }

      const data = await getAnalytics(user.id)
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingPage text="Loading analytics..." />
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    )
  }

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'indigo',
  }: {
    title: string
    value: string | number
    icon: any
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    color?: string
  }) => {
    const colorClasses = {
      indigo: 'from-indigo-500 to-indigo-600',
      green: 'from-green-500 to-green-600',
      blue: 'from-blue-500 to-blue-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600',
    }

    return (
      <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-2">{value}</p>
              {trend && trendValue && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend === 'up' && <TrendingUp className="h-4 w-4" />}
                  {trend === 'down' && <TrendingDown className="h-4 w-4" />}
                  <span className="font-medium">{trendValue}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.indigo}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Analytics & Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive business insights and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analytics.totalRevenue, currency)}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(analytics.monthlyRevenue, currency)}
          icon={TrendingUp}
          trend={analytics.revenueGrowth >= 0 ? 'up' : 'down'}
          trendValue={`${analytics.revenueGrowth >= 0 ? '+' : ''}${analytics.revenueGrowth.toFixed(1)}%`}
          color="blue"
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(analytics.netProfit, currency)}
          icon={BarChart3}
          color={analytics.netProfit >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          title="Profit Margin"
          value={`${analytics.profitMargin.toFixed(1)}%`}
          icon={TrendingUp}
          color={analytics.profitMargin >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Revenue, Expenses & Profit Trend */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
          <CardTitle>Revenue & Profit Trend (Last 12 Months)</CardTitle>
          <CardDescription>Monthly revenue, expenses, and net profit</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={analytics.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value), currency)}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Revenue"
                dot={{ fill: '#10b981' }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Expenses"
                dot={{ fill: '#f59e0b' }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#6366f1"
                strokeWidth={2}
                name="Net Profit"
                dot={{ fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Invoice Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Status Breakdown */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>Breakdown by invoice status</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.invoiceStatusBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.invoiceStatusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${value} invoices (${formatCurrency(props.payload.value, currency)})`,
                    props.payload.status,
                  ]}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Metrics */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
            <CardTitle>Invoice Metrics</CardTitle>
            <CardDescription>Key invoice statistics</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <span className="text-sm font-medium text-green-900">Paid Invoices</span>
                <span className="text-lg font-bold text-green-700">{analytics.paidInvoices}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <span className="text-sm font-medium text-blue-900">Pending Invoices</span>
                <span className="text-lg font-bold text-blue-700">{analytics.pendingInvoices}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                <span className="text-sm font-medium text-red-900">Overdue Invoices</span>
                <span className="text-lg font-bold text-red-700">{analytics.overdueInvoices}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <span className="text-sm font-medium text-purple-900">Average Invoice Value</span>
                <span className="text-lg font-bold text-purple-700">
                  {formatCurrency(analytics.averageInvoiceValue, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Total Invoices</span>
                <span className="text-lg font-bold text-gray-700">{analytics.totalInvoices}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers & Products */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Customers */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
            <CardTitle>Top 5 Customers</CardTitle>
            <CardDescription>By total revenue</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), currency)}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="totalSpent" fill="#6366f1" name="Total Spent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
            <CardTitle>Top 5 Products</CardTitle>
            <CardDescription>By revenue generated</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topSellingProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), currency)}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Customers"
          value={analytics.totalCustomers}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Customers"
          value={analytics.activeCustomers}
          icon={Users}
          color="green"
        />
        <MetricCard
          title="Total Products"
          value={analytics.totalProducts}
          icon={Package}
          color="purple"
        />
        <MetricCard
          title="Low Stock Products"
          value={analytics.lowStockProducts}
          icon={AlertCircle}
          color="orange"
        />
      </div>

      {/* Financial Summary */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-100">
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Overview of your financial performance</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(analytics.totalRevenue, currency)}
              </p>
              <p className="text-xs text-muted-foreground">All-time revenue from paid invoices</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(analytics.totalExpenses, currency)}
              </p>
              <p className="text-xs text-muted-foreground">All-time business expenses</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
              <p className={`text-3xl font-bold ${analytics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(analytics.netProfit, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                Profit margin: {analytics.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
