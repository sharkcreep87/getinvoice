import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, Users, TrendingUp } from "lucide-react"

async function getDashboardStats(userId: string) {
  const supabase = createServerClient()

  const [customersResult, invoicesResult] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact' }).eq('user_id', userId),
    supabase.from('invoices').select('*').eq('user_id', userId),
  ])

  const customers = customersResult.data || []
  const invoices = invoicesResult.data || []

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
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const stats = await getDashboardStats(user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile?.full_name || 'User'}!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Customers
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Invoices
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Amount
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats.pendingAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentInvoices.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No invoices yet. Create your first invoice to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {stats.recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${invoice.total.toFixed(2)}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/dashboard/customers"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium">Add Customer</h3>
              <p className="text-sm text-gray-600">Create a new customer profile</p>
            </a>
            <a
              href="/dashboard/invoices"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium">New Invoice</h3>
              <p className="text-sm text-gray-600">Generate a new invoice</p>
            </a>
            <a
              href="/dashboard/subscription"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium">Upgrade Plan</h3>
              <p className="text-sm text-gray-600">View subscription options</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
