import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BarChart3, FileText, Users, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">GetInvoice</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Modern CRM & Invoice Management
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your customer relationships and create professional invoices in minutes.
            Built for modern businesses.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register">
              <Button size="lg" className="text-lg">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
          <p className="text-gray-600">Powerful features to manage your business efficiently</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-2" />
              <CardTitle>CRM System</CardTitle>
              <CardDescription>
                Manage customers, track interactions, and build lasting relationships
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <FileText className="h-12 w-12 text-blue-600 mb-2" />
              <CardTitle>Invoice Generator</CardTitle>
              <CardDescription>
                Create beautiful, professional invoices with PDF export
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-blue-600 mb-2" />
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Get insights into your business with powerful analytics
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-blue-600 mb-2" />
              <CardTitle>Fast & Secure</CardTitle>
              <CardDescription>
                Built with modern technology for speed and security
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
          <p className="text-gray-600">Choose the plan that fits your business</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>For getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>5 customers</li>
                <li>10 invoices/month</li>
                <li>Basic support</li>
              </ul>
              <Link href="/register">
                <Button className="w-full mt-4" variant="outline">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="border-blue-600">
            <CardHeader>
              <CardTitle>Basic</CardTitle>
              <CardDescription>For small businesses</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>50 customers</li>
                <li>100 invoices/month</li>
                <li>Email support</li>
                <li>Custom branding</li>
              </ul>
              <Link href="/register">
                <Button className="w-full mt-4">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For growing teams</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Unlimited customers</li>
                <li>Unlimited invoices</li>
                <li>Priority support</li>
                <li>Advanced analytics</li>
                <li>API access</li>
              </ul>
              <Link href="/register">
                <Button className="w-full mt-4" variant="outline">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>For large organizations</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Everything in Pro</li>
                <li>Dedicated support</li>
                <li>Custom integrations</li>
                <li>SLA guarantee</li>
                <li>Multi-user access</li>
              </ul>
              <Link href="/register">
                <Button className="w-full mt-4" variant="outline">Contact Sales</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 GetInvoice. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
