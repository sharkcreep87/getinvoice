'use client'

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, TrendingUp, Calculator, Plus, Trash2, DollarSign, Bot, Send, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AIUsageBadge } from "@/components/ai-usage-badge"

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Ingredient = {
  id: string
  name: string
  quantity: number
  unit: string
  unit_price_rm: number
  cost_per_unit_rm: number
}

type CostForecastData = {
  product_name: string
  serving_unit: string
  ingredients: Ingredient[]
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
      // Read custom prompt from admin settings
      let customPrompt = ''
      try {
        const savedSettings = localStorage.getItem('admin_settings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          customPrompt = settings.ai_cost_forecast_prompt || ''
        }
      } catch (e) {
        console.error('Failed to read admin settings:', e)
      }

      const response = await fetch('/api/cost-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: userMessage,
          conversationHistory: messages,
          customPrompt,
        }),
      })

      const data = await response.json()

      console.log('API Response:', data) // Debug log

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get forecast')
      }

      // Check if we got JSON data (forecast generated)
      if (data.jsonData) {
        // Add success message to chat instead of full AI response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Successfully generated cost forecast! You can now view and edit all values in the tables below.'
        }])

        // Set forecast data with editable ingredients
        // IMPORTANT: Recalculate cost_per_unit_rm based on quantity × unit_price_rm
        const ingredientsWithIds = data.jsonData.ingredients.map((ing: any, index: number) => {
          const quantity = Number(ing.quantity) || 0
          const unitPrice = Number(ing.unit_price_rm) || 0
          const calculatedCost = quantity * unitPrice

          return {
            ...ing,
            id: `${Date.now()}-${index}`,
            quantity,
            unit_price_rm: unitPrice,
            cost_per_unit_rm: calculatedCost, // Recalculate to ensure accuracy
          }
        })

        // Recalculate total cost based on corrected ingredient costs
        const recalculatedTotalCost = ingredientsWithIds.reduce((sum: number, ing: Ingredient) => sum + ing.cost_per_unit_rm, 0)

        setCurrentForecast({
          ...data.jsonData,
          ingredients: ingredientsWithIds,
          total_cost_per_unit_rm: recalculatedTotalCost,
        })

        toast({
          title: "Success",
          description: "Cost forecast generated! You can now edit all values.",
        })
      } else {
        // No JSON data - AI is asking for clarification
        // Show the full AI response for conversation
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate cost forecast",
        variant: "destructive",
      })
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleIngredientChange = (id: string, field: keyof Ingredient, value: string | number) => {
    if (!currentForecast) return

    setCurrentForecast(prev => {
      if (!prev) return null

      const updatedIngredients = prev.ingredients.map(ing => {
        if (ing.id === id) {
          const updated = { ...ing, [field]: value }

          // Auto-calculate cost_per_unit when quantity or unit_price changes
          if (field === 'quantity' || field === 'unit_price_rm') {
            const qty = field === 'quantity' ? Number(value) : Number(updated.quantity)
            const price = field === 'unit_price_rm' ? Number(value) : Number(updated.unit_price_rm)
            updated.cost_per_unit_rm = qty * price
            console.log('💰 Cost calculation:', { qty, price, cost: updated.cost_per_unit_rm })
          }

          return updated
        }
        return ing
      })

      const totalCost = updatedIngredients.reduce((sum: number, ing: Ingredient) => {
        return sum + Number(ing.cost_per_unit_rm || 0)
      }, 0)

      console.log('📊 Total cost updated:', {
        field,
        value,
        ingredientCount: updatedIngredients.length,
        totalCost,
        ingredientCosts: updatedIngredients.map(i => ({ name: i.name, cost: i.cost_per_unit_rm }))
      })

      // Maintain the same profit margin percentage
      const currentMargin = prev.profit_margin_percent

      // Calculate new suggested price based on margin: price = cost / (1 - margin/100)
      let suggestedPrice = prev.suggested_selling_price_rm
      if (currentMargin > 0 && currentMargin < 100) {
        suggestedPrice = totalCost / (1 - currentMargin / 100)
      } else if (totalCost > 0) {
        // If margin is 0 or invalid, maintain the same profit amount
        const currentProfit = prev.profit_per_unit_rm
        suggestedPrice = totalCost + currentProfit
      }

      const profit = suggestedPrice - totalCost
      const margin = suggestedPrice > 0 ? (profit / suggestedPrice) * 100 : 0

      return {
        ...prev,
        ingredients: updatedIngredients,
        total_cost_per_unit_rm: totalCost,
        suggested_selling_price_rm: suggestedPrice,
        profit_per_unit_rm: profit,
        profit_margin_percent: margin,
      }
    })
  }

  const handleSuggestedPriceChange = (value: number) => {
    if (!currentForecast) return

    const totalCost = currentForecast.total_cost_per_unit_rm
    const profit = value - totalCost
    const margin = value > 0 ? (profit / value) * 100 : 0

    setCurrentForecast(prev => prev ? {
      ...prev,
      suggested_selling_price_rm: value,
      profit_per_unit_rm: profit,
      profit_margin_percent: margin,
    } : null)
  }

  const addIngredient = () => {
    if (!currentForecast) return

    const newIngredient: Ingredient = {
      id: `${Date.now()}`,
      name: 'New Ingredient',
      quantity: 1,
      unit: 'pcs',
      unit_price_rm: 0,
      cost_per_unit_rm: 0,
    }

    setCurrentForecast(prev => prev ? {
      ...prev,
      ingredients: [...prev.ingredients, newIngredient],
    } : null)
  }

  const removeIngredient = (id: string) => {
    if (!currentForecast) return

    setCurrentForecast(prev => {
      if (!prev) return null

      const updatedIngredients = prev.ingredients.filter(ing => ing.id !== id)
      const totalCost = updatedIngredients.reduce((sum: number, ing: Ingredient) => {
        return sum + Number(ing.cost_per_unit_rm || 0)
      }, 0)

      // Maintain the same profit margin percentage
      const currentMargin = prev.profit_margin_percent

      // Calculate new suggested price based on margin
      let suggestedPrice = prev.suggested_selling_price_rm
      if (currentMargin > 0 && currentMargin < 100) {
        suggestedPrice = totalCost / (1 - currentMargin / 100)
      } else if (totalCost > 0) {
        const currentProfit = prev.profit_per_unit_rm
        suggestedPrice = totalCost + currentProfit
      }

      const profit = suggestedPrice - totalCost
      const margin = suggestedPrice > 0 ? (profit / suggestedPrice) * 100 : 0

      return {
        ...prev,
        ingredients: updatedIngredients,
        total_cost_per_unit_rm: totalCost,
        suggested_selling_price_rm: suggestedPrice,
        profit_per_unit_rm: profit,
        profit_margin_percent: margin,
      }
    })
  }

  const handleReset = () => {
    setCurrentForecast(null)
    setMessages([])
    setProductName("")
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
          unit_price: currentForecast.suggested_selling_price_rm,
          cost_price: currentForecast.total_cost_per_unit_rm,
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
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Calculator className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Cost Forecast Calculator</h1>
            </div>
            <AIUsageBadge />
          </div>
          <p className="text-white/90 text-sm sm:text-base lg:text-lg">
            AI-powered product pricing & cost analysis for Malaysian food & products
          </p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Chat Interface */}
        <Card className="lg:col-span-2 border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bot className="h-5 w-5 text-primary" />
              AI Assistant
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Enter a product name to get cost analysis. AI may ask for clarification.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6">
            {/* Messages */}
            <div className="mb-4 h-[300px] sm:h-[350px] lg:h-[400px] overflow-y-auto space-y-3 p-3 sm:p-4 bg-secondary/5 rounded-lg">
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
                      className={`max-w-[95%] sm:max-w-[85%] lg:max-w-[80%] rounded-lg p-3 sm:p-4 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-primary to-secondary text-white'
                          : 'bg-white border border-primary/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 whitespace-pre-wrap text-xs sm:text-sm break-words">
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
                placeholder="Product name or your response..."
                disabled={loading}
                className="flex-1 text-sm"
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
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Forecast Summary
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              All costs are per single unit
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6">
            {currentForecast ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <Input
                    value={currentForecast.product_name}
                    onChange={(e) => setCurrentForecast(prev => prev ? { ...prev, product_name: e.target.value } : null)}
                    className="mt-1 font-semibold text-lg"
                  />
                  <Input
                    value={currentForecast.serving_unit}
                    onChange={(e) => setCurrentForecast(prev => prev ? { ...prev, serving_unit: e.target.value } : null)}
                    className="mt-2 text-xs"
                    placeholder="Serving unit"
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Cost</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(currentForecast.total_cost_per_unit_rm)}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">Suggested Price</span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={currentForecast.suggested_selling_price_rm}
                        onChange={(e) => handleSuggestedPriceChange(parseFloat(e.target.value) || 0)}
                        className="text-right font-semibold text-secondary text-lg"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Profit</span>
                      <span className={`font-semibold ${currentForecast.profit_per_unit_rm >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(currentForecast.profit_per_unit_rm)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Margin</span>
                      <span className={`font-semibold ${currentForecast.profit_margin_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currentForecast.profit_margin_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Ingredients ({currentForecast.ingredients.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {currentForecast.ingredients.map((ingredient) => (
                      <div key={ingredient.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate">{ingredient.name}</span>
                        <span className="font-medium">{formatCurrency(ingredient.cost_per_unit_rm)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
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
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-md active:scale-[0.98] transition-all duration-200"
                  >
                    New Forecast
                  </Button>
                </div>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Detailed Ingredient Breakdown</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Edit any value to recalculate totals
                </CardDescription>
              </div>
              <Button
                onClick={addIngredient}
                size="sm"
                className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6">
            {/* Per Unit Reminder */}
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    ⚠️ All quantities are per SINGLE unit ({currentForecast.serving_unit})
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Each ingredient quantity shown is the amount needed to make ONE {currentForecast.serving_unit} only.
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm text-gray-900">
                      Ingredient
                    </th>
                    <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm text-gray-900">
                      <div>Quantity</div>
                      <div className="text-[10px] font-normal text-blue-600">(Per Unit)</div>
                    </th>
                    <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm text-gray-900">
                      Unit
                    </th>
                    <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm text-gray-900">
                      Price per Unit (RM)
                    </th>
                    <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm text-gray-900">
                      <div>Total Cost (RM)</div>
                      <div className="text-[10px] font-normal text-gray-500">(Qty × Price)</div>
                    </th>
                    <th className="text-center py-2 sm:py-3 px-2 font-semibold text-xs sm:text-sm text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentForecast.ingredients.map((ingredient) => (
                    <tr key={ingredient.id} className="border-b border-gray-200 hover:bg-secondary/5">
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <Input
                          value={ingredient.name}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'name', e.target.value)}
                          className="text-xs sm:text-sm min-w-[120px]"
                        />
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <Input
                          type="number"
                          step="0.01"
                          value={ingredient.quantity}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="text-xs sm:text-sm text-right w-20"
                        />
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <Input
                          value={ingredient.unit}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'unit', e.target.value)}
                          className="text-xs sm:text-sm text-right w-16"
                        />
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <Input
                          type="number"
                          step="0.01"
                          value={ingredient.unit_price_rm}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'unit_price_rm', parseFloat(e.target.value) || 0)}
                          className="text-xs sm:text-sm text-right w-24"
                        />
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-right whitespace-nowrap">
                        <div className="font-medium text-primary text-xs sm:text-sm">
                          {formatCurrency(ingredient.cost_per_unit_rm)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {ingredient.quantity} × {formatCurrency(ingredient.unit_price_rm)}
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(ingredient.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-primary/20 bg-primary/5 font-semibold">
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900" colSpan={4}>
                      Total Cost
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-right text-primary whitespace-nowrap">
                      {formatCurrency(currentForecast.total_cost_per_unit_rm)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {currentForecast.assumptions.length > 0 && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-xs sm:text-sm text-yellow-900 mb-2">AI Assumptions</h4>
                <ul className="space-y-1">
                  {currentForecast.assumptions.map((assumption, index) => (
                    <li key={index} className="text-xs text-yellow-800 break-words">
                      • {assumption}
                    </li>
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
