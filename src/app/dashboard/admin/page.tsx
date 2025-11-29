'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, FileText, DollarSign, TrendingUp, Settings, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { LoadingPage } from "@/components/ui/loading"
import { formatCurrency } from "@/lib/utils"

type AdminStats = {
  totalUsers: number
  totalInvoices: number
  totalRevenue: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
}

type User = {
  id: string
  email: string
  full_name: string
  role: string
  subscription_tier: string
  created_at: string
}

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: string
  subscription_tier: string
  created_at: string
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
  })
  const [users, setUsers] = useState<User[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: string } | null }

      if (profile?.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard",
          variant: "destructive",
        })
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      loadAdminData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify admin access",
        variant: "destructive",
      })
      router.push('/dashboard')
    }
  }

  const loadAdminData = async () => {
    try {
      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      // Load all invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')

      if (usersData) {
        setUsers(usersData)
      }

      if (invoicesData) {
        const totalRevenue = invoicesData
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + Number(inv.total), 0)

        const paidInvoices = invoicesData.filter(inv => inv.status === 'paid').length
        const pendingInvoices = invoicesData.filter(inv => inv.status === 'sent' || inv.status === 'draft').length
        const overdueInvoices = invoicesData.filter(inv => inv.status === 'overdue').length

        setStats({
          totalUsers: usersData?.length || 0,
          totalInvoices: invoicesData.length,
          totalRevenue,
          paidInvoices,
          pendingInvoices,
          overdueInvoices,
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
        // @ts-ignore
        variant: "success",
      })

      loadAdminData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <LoadingPage text="Loading admin dashboard..." />
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage users, view analytics, and configure system settings</p>
        </div>
        <Button onClick={() => router.push('/dashboard/admin/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          System Settings
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-600 mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.paidInvoices} paid, {stats.pendingInvoices} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue, 'MYR')}</div>
            <p className="text-xs text-gray-600 mt-1">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueInvoices}</div>
            <p className="text-xs text-gray-600 mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{user.subscription_tier}</span>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRoleChange(user.id, 'user')}
                      >
                        Remove Admin
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleRoleChange(user.id, 'admin')}
                      >
                        Make Admin
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
