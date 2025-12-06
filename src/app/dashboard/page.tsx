import Link from "next/link"
import { FileText, DollarSign, Users, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export const dynamic = 'force-dynamic'

async function getDashboardStats(userId: string, userCurrency: string) {
  const supabase = await createServerClient()

  const [customersResult, invoicesResult] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('invoices').select('id, invoice_number, status, issue_date, due_date, total, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
  ])

  const customers = (customersResult.data || []) as any[]
  const invoices = (invoicesResult.data || []) as any[]

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)

  const pendingAmount = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0)

  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid') return false
    const dueDate = new Date(inv.due_date)
    return dueDate < new Date()
  })

  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)

  const paidInvoicesCount = invoices.filter(inv => inv.status === 'paid').length

  return {
    totalCustomers: customersResult.count || 0,
    totalInvoices: invoices.length,
    paidInvoices: paidInvoicesCount,
    totalRevenue,
    pendingAmount,
    overdueCount: overdueInvoices.length,
    overdueAmount,
    recentInvoices: invoices.slice(0, 5),
    currency: userCurrency,
  }
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const profileResult = await supabase
    .from('profiles')
    .select('full_name, currency')
    .eq('id', user.id)
    .single()

  const profile = profileResult.data as any
  const userCurrency = profile?.currency || 'MYR'

  const stats = await getDashboardStats(user.id, userCurrency)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Welcome back, {profile?.full_name || 'User'}! 👋</h1>
          <p className="text-white/90 text-sm sm:text-base lg:text-lg">Here's your business overview</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {/* Total Customers */}
        <Card className="border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {stats.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active clients</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <div className="p-2 bg-secondary/10 rounded-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-secondary">
              {formatCurrency(stats.totalRevenue, stats.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.paidInvoices} paid invoices</p>
          </CardContent>
        </Card>

        {/* Pending Amount */}
        <Card className="border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              {formatCurrency(stats.pendingAmount, stats.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="border border-red-200 hover:border-red-300 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
              {stats.overdueCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(stats.overdueAmount, stats.currency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="border border-primary/20 shadow-md">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Recent Invoices
            </CardTitle>
            <Link href="/dashboard/invoices" className="text-sm text-primary hover:text-secondary font-medium transition-colors">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {stats.recentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-primary/5 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-10 w-10 text-primary/40" />
              </div>
              <p className="text-muted-foreground">
                No invoices yet. Create your first invoice!
              </p>
              <Link href="/dashboard/invoices">
                <button className="mt-4 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-sm hover:shadow-lg transition-all">
                  Create Invoice
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentInvoices.map((invoice) => (
                <Link key={invoice.id} href={`/dashboard/invoices?view=${invoice.id}`} className="block">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary/40 transition-all hover:shadow-md bg-white group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.issue_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-secondary">
                        {formatCurrency(invoice.total, stats.currency)}
                      </p>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'sent'
                            ? 'bg-primary/10 text-primary'
                            : invoice.status === 'draft'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/dashboard/customers"
              className="group p-5 border border-primary/20 rounded-xl hover:border-primary transition-all hover:shadow-lg bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-primary/10 group-hover:bg-primary/20 rounded-lg transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Add Customer</h3>
                  <p className="text-sm text-muted-foreground">Create new client</p>
                </div>
              </div>
            </Link>
            <Link
              href="/dashboard/invoices"
              className="group p-5 border border-secondary/20 rounded-xl hover:border-secondary transition-all hover:shadow-lg bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-secondary/10 group-hover:bg-secondary/20 rounded-lg transition-colors">
                  <FileText className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">New Invoice</h3>
                  <p className="text-sm text-muted-foreground">Generate invoice</p>
                </div>
              </div>
            </Link>
            <Link
              href="/dashboard/products"
              className="group p-5 border border-primary/20 rounded-xl hover:border-primary transition-all hover:shadow-lg bg-white sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-primary/10 group-hover:bg-primary/20 rounded-lg transition-colors">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Add Product</h3>
                  <p className="text-sm text-muted-foreground">Manage inventory</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
