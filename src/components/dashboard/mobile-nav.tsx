'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  CreditCard,
  Building2,
  Menu,
  Shield,
  Package,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Company", href: "/dashboard/company", icon: Building2 },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const adminNavigation = [
  { name: "Admin Dashboard", href: "/dashboard/admin", icon: Shield },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkAdminRole()
  }, [])

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: string } | null }

      if (profile?.role === 'admin') {
        setIsAdmin(true)
      }
    } catch (error) {
      console.error('Failed to check admin role:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      })
      router.push("/login")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="md:hidden border-b bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white">
      <div className="flex items-center justify-between p-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <div className="flex items-center">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 mr-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="ml-2 text-lg font-bold bg-gradient-to-r from-primary via-indigo-400 to-indigo-700 bg-clip-text text-transparent">
              GetInvoice
            </span>
          </div>
            <SheetContent side="left" className="w-64 p-0 bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 text-white border-primary/20">
            <SheetHeader className="p-6 border-b border-primary/20 bg-black/20">
              <SheetTitle className="flex items-center text-white">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-indigo-600">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary via-indigo-400 to-indigo-700 bg-clip-text text-transparent">
                  GetInvoice
                </span>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-primary/90 to-indigo-600/90 text-white shadow-lg shadow-primary/50"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className={cn("mr-3 h-5 w-5", isActive && "animate-pulse")} />
                    {item.name}
                  </Link>
                )
              })}

              {/* Admin Navigation */}
              {isAdmin && (
                <>
                  <div className="my-4 border-t border-white/10" />
                  {adminNavigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/50"
                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon className={cn("mr-3 h-5 w-5", isActive && "animate-pulse")} />
                        {item.name}
                      </Link>
                    )
                  })}
                </>
              )}
            </nav>

            <div className="p-4 border-t border-primary/20 bg-black/20">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
