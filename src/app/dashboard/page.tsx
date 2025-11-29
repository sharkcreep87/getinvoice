import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, Users, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export const dynamic = 'force-dynamic'

async function getDashboardStats(userId: string) {
  const supabase = await createServerClient()

  const [customersResult, invoicesResult] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact' }).eq('user_id', userId),
    supabase.from('invoices').select('*').eq('user_id', userId),
  ])

  const customers = (customersResult.data || []) as any[]
  const invoices = (invoicesResult.data || []) as any[]

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)

  const pendingAmount = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0)

  return {
    totalCustomers: customersResult.count || 0,
    totalInvoices: invoices.length,
    totalRevenue,
    pendingAmount,
    recentInvoices: invoices.slice(0, 5),
  }
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const stats = await getDashboardStats(user.id)

  const profileResult = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileResult.data as any
  const userCurrency = profile?.currency || 'MYR'

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-pink-500 to-purple-600 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {profile?.full_name || 'User'}! 👋</h1>
          <p className="text-white/90 text-lg">Here's what's happening with your business today</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-xl hover:shadow-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-primary/5 to-transparent">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <div className="p-2 bg-gradient-to-br from-primary to-pink-500 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
              {stats.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active customer base</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-pink-200/50 hover:border-pink-300 transition-all hover:shadow-xl hover:shadow-pink-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-pink-50 to-transparent">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              {stats.totalInvoices}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total invoices created</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200/50 hover:border-green-300 transition-all hover:shadow-xl hover:shadow-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-green-50 to-transparent">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatCurrency(stats.totalRevenue, userCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Paid invoices</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200/50 hover:border-orange-300 transition-all hover:shadow-xl hover:shadow-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-orange-50 to-transparent">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Amount
            </CardTitle>
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {formatCurrency(stats.pendingAmount, userCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-pink-50">
          <CardTitle className="text-xl bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {stats.recentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">
                No invoices yet. Create your first invoice to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-md bg-gradient-to-r from-white to-primary/5"
                >
                  <div>
                    <p className="font-semibold text-lg">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
                      {formatCurrency(invoice.total, userCurrency)}
                    </p>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                          : invoice.status === 'sent'
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                          : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
                      }`}
                    >
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-pink-50">
          <CardTitle className="text-xl bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/dashboard/customers"
              className="group relative overflow-hidden p-6 border-2 border-primary/20 rounded-xl hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20 bg-gradient-to-br from-white to-primary/5"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all"></div>
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-primary to-pink-500 rounded-xl inline-block mb-3">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">Add Customer</h3>
                <p className="text-sm text-muted-foreground">Create a new customer profile</p>
              </div>
            </a>
            <a
              href="/dashboard/invoices"
              className="group relative overflow-hidden p-6 border-2 border-pink-200/50 rounded-xl hover:border-pink-400 transition-all hover:shadow-lg hover:shadow-pink-500/20 bg-gradient-to-br from-white to-pink-50"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-pink-200/50 blur-2xl group-hover:bg-pink-300/50 transition-all"></div>
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl inline-block mb-3">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">New Invoice</h3>
                <p className="text-sm text-muted-foreground">Generate a new invoice</p>
              </div>
            </a>
            <a
              href="/dashboard/subscription"
              className="group relative overflow-hidden p-6 border-2 border-purple-200/50 rounded-xl hover:border-purple-400 transition-all hover:shadow-lg hover:shadow-purple-500/20 bg-gradient-to-br from-white to-purple-50"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-200/50 blur-2xl group-hover:bg-purple-300/50 transition-all"></div>
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl inline-block mb-3">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">Upgrade Plan</h3>
                <p className="text-sm text-muted-foreground">View subscription options</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
