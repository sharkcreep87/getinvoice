'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  CreditCard,
  Building2,
  Shield,
  Package,
  Calculator,
  Receipt,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Wallet
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

type NavItem = {
  name: string
  href: string
  icon: any
}

type NavCategory = {
  name: string
  icon: any
  items: NavItem[]
}

const mainNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
]

const navigationCategories: NavCategory[] = [
  {
    name: "Sales & Orders",
    icon: ShoppingBag,
    items: [
      { name: "Customers", href: "/dashboard/customers", icon: Users },
      { name: "Products", href: "/dashboard/products", icon: Package },
      { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
      { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    ]
  },
  {
    name: "Financial",
    icon: Wallet,
    items: [
      { name: "Cost Forecast", href: "/dashboard/cost-forecast", icon: Calculator },
      { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
    ]
  },
  {
    name: "Settings",
    icon: Settings,
    items: [
      { name: "Company", href: "/dashboard/company", icon: Building2 },
      { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ]
  }
]

const adminNavigation = [
  { name: "Admin Dashboard", href: "/dashboard/admin", icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "Sales & Orders",
    "Financial",
    "Settings"
  ])

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

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    )
  }

  const isCategoryActive = (category: NavCategory) => {
    return category.items.some(item => pathname === item.href)
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white border-r border-primary/20">
      <div className="flex h-16 items-center px-6 border-b border-primary/20 bg-black/20">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
          GetInvoice
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {/* Main Navigation - Dashboard */}
        {mainNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-primary/90 to-secondary/90 text-white shadow-lg shadow-primary/50"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn("mr-3 h-5 w-5", isActive && "animate-pulse")} />
              {item.name}
            </Link>
          )
        })}

        {/* Category Navigation */}
        {navigationCategories.map((category) => {
          const CategoryIcon = category.icon
          const isExpanded = expandedCategories.includes(category.name)
          const isCatActive = isCategoryActive(category)

          return (
            <div key={category.name} className="space-y-1">
              <button
                onClick={() => toggleCategory(category.name)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                  isCatActive
                    ? "text-primary"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center">
                  <CategoryIcon className="mr-3 h-4 w-4" />
                  {category.name}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Submenu Items */}
              {isExpanded && (
                <div className="ml-4 space-y-0.5 border-l-2 border-white/10 pl-2">
                  {category.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-primary/90 to-secondary/90 text-white shadow-lg shadow-primary/50 font-medium"
                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon className={cn("mr-3 h-4 w-4", isActive && "animate-pulse")} />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
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
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-secondary to-primary text-white shadow-lg shadow-secondary/50"
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
    </div>
  )
}
