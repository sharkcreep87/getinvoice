'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Bot, Send, Loader2, TrendingUp, DollarSign, Calculator, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type CostForecastData = {
  product_name: string
  serving_unit: string
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    unit_price_rm: number
    cost_per_unit_rm: number
  }>
  total_cost_per_unit_rm: number
  suggested_selling_price_rm: number
  profit_per_unit_rm: number
  profit_margin_percent: number
  assumptions: string[]
}

export default function CostForecastPage() {
  const [productName, setProductName] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentForecast, setCurrentForecast] = useState<CostForecastData | null>(null)
  const [savingToProducts, setSavingToProducts] = useState(false)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim() || loading) return

    setLoading(true)
    const userMessage = productName.trim()
    setProductName("")

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/cost-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: userMessage,
          conversationHistory: messages,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get forecast')
      }

      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])

      // Update forecast data if available
      if (data.jsonData) {
        setCurrentForecast(data.jsonData)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate cost forecast",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToProducts = async () => {
    if (!currentForecast) return

    setSavingToProducts(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Insert product to database
      const { error } = await (supabase as any)
        .from('products')
        .insert({
          user_id: user.id,
          name: currentForecast.product_name,
          description: `${currentForecast.serving_unit} - AI Generated`,
          price: currentForecast.suggested_selling_price_rm,
          cost: currentForecast.total_cost_per_unit_rm,
          stock: 0,
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Product saved successfully! You can view it in the Products page.",
      })

      // Optionally redirect to products page
      setTimeout(() => {
        router.push('/dashboard/products')
      }, 1500)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      })
    } finally {
      setSavingToProducts(false)
    }
  }

  const handleReset = () => {
    setMessages([])
    setCurrentForecast(null)
    setProductName("")
  }

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calculator className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Cost Forecast Assistant</h1>
          </div>
          <p className="text-white/90 text-sm sm:text-base lg:text-lg">
            AI-powered product pricing & cost analysis for Malaysian food & products
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface */}
        <Card className="lg:col-span-2 border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Enter a product name to get cost analysis and pricing recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Messages */}
            <div className="mb-4 h-[400px] overflow-y-auto space-y-4 p-4 bg-secondary/5 rounded-lg">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-16 w-16 text-primary/40 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    Start by entering a product name like "Karipap", "Nasi Lemak", or "Iced Latte"
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-primary to-secondary text-white'
                          : 'bg-white border border-primary/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-primary/20 rounded-lg p-4">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name (e.g., Karipap, Nasi Lemak)"
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={loading || !productName.trim()}
                className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-md active:scale-[0.98] transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Forecast Summary */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Forecast Summary
            </CardTitle>
            <CardDescription>
              Quick overview of pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {currentForecast ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="text-lg font-semibold text-gray-900">{currentForecast.product_name}</p>
                  <p className="text-xs text-muted-foreground">{currentForecast.serving_unit}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Cost</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(currentForecast.total_cost_per_unit_rm)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Suggested Price</span>
                      <span className="font-semibold text-secondary text-lg">
                        {formatCurrency(currentForecast.suggested_selling_price_rm)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Profit</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(currentForecast.profit_per_unit_rm)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Margin</span>
                      <span className="font-semibold text-green-600">
                        {currentForecast.profit_margin_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Ingredients ({currentForecast.ingredients.length})</p>
                  <div className="space-y-1">
                    {currentForecast.ingredients.slice(0, 5).map((ingredient, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate">{ingredient.name}</span>
                        <span className="font-medium">{formatCurrency(ingredient.cost_per_unit_rm)}</span>
                      </div>
                    ))}
                    {currentForecast.ingredients.length > 5 && (
                      <p className="text-xs text-muted-foreground italic">
                        +{currentForecast.ingredients.length - 5} more...
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleSaveToProducts}
                  disabled={savingToProducts}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {savingToProducts ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Save to Products
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 text-primary/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No forecast yet. Ask the AI about a product to see pricing analysis.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      {currentForecast && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/10">
            <CardTitle>Detailed Ingredient Breakdown</CardTitle>
            <CardDescription>Complete cost analysis for {currentForecast.product_name}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-900">Ingredient</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-gray-900">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-gray-900">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-gray-900">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {currentForecast.ingredients.map((ingredient, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-secondary/5">
                      <td className="py-3 px-4 text-sm text-gray-900">{ingredient.name}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600">
                        {ingredient.quantity} {ingredient.unit}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600">
                        {formatCurrency(ingredient.unit_price_rm)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-primary">
                        {formatCurrency(ingredient.cost_per_unit_rm)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-primary/20 bg-primary/5 font-semibold">
                    <td className="py-3 px-4 text-sm text-gray-900" colSpan={3}>Total Cost</td>
                    <td className="py-3 px-4 text-sm text-right text-primary">
                      {formatCurrency(currentForecast.total_cost_per_unit_rm)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {currentForecast.assumptions.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-sm text-yellow-900 mb-2">Assumptions</h4>
                <ul className="space-y-1">
                  {currentForecast.assumptions.map((assumption, index) => (
                    <li key={index} className="text-xs text-yellow-800">• {assumption}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
