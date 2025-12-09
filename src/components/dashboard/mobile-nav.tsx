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
  Calculator,
  Receipt,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Wallet,
  BarChart3,
} from "@/components/ui/animated-icons"
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
      { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
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
      { name: "Profile", href: "/dashboard/settings", icon: Settings },
    ]
  }
]

const adminNavigation = [
  { name: "Admin Dashboard", href: "/dashboard/admin", icon: Shield },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "Sales & Orders",
    "Financial",
    "Settings"
  ])
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
    <div className="md:hidden border-b bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="flex items-center justify-between p-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <div className="flex items-center">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 mr-2">
                <Menu size={24} />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <FileText size={20} />
            </div>
            <span className="ml-2 text-lg font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              GetInvoice
            </span>
          </div>
          <SheetContent side="left" className="w-64 p-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white border-primary/20">
            <SheetHeader className="p-6 border-b border-primary/20 bg-black/20">
              <SheetTitle className="flex items-center text-white">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary">
                  <FileText size={24} />
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                  GetInvoice
                </span>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto max-h-[calc(100vh-180px)]">
              {/* Main Navigation - Dashboard */}
              {mainNavigation.map((item) => {
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
                        ? "bg-gradient-to-r from-primary/90 to-secondary/90 text-white shadow-lg shadow-primary/50"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="mr-3">
                      <Icon size={20} />
                    </div>
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
                        <div className="mr-3">
                          <CategoryIcon size={16} />
                        </div>
                        {category.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
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
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                                isActive
                                  ? "bg-gradient-to-r from-primary/90 to-secondary/90 text-white shadow-lg shadow-primary/50 font-medium"
                                  : "text-gray-300 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <div className="mr-3">
                                <Icon size={16} />
                              </div>
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
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-secondary to-primary text-white shadow-lg shadow-secondary/50"
                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <div className="mr-3">
                      <Icon size={20} />
                    </div>
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
                <div className="mr-3">
                  <LogOut size={20} />
                </div>
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
