'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Package, Plus, Edit, Trash2, Search, Calculator } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { LoadingPage } from "@/components/ui/loading"
import { formatCurrency } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  calculatePricing,
  calculateSellingPrice,
  type PricingMode,
} from "@/lib/pricing-calculator"

type Product = {
  id: string
  user_id: string
  name: string
  description: string | null
  cost_price: number
  unit_price: number
  created_at: string
  updated_at: string
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost_price: "",
    unit_price: "",
  })
  const [pricingMode, setPricingMode] = useState<PricingMode>('markup')
  const [percentage, setPercentage] = useState("50")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      loadProducts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to authenticate",
        variant: "destructive",
      })
      router.push('/login')
    }
  }

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setProducts(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await (supabase as any)
        .from('products')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description || null,
          cost_price: parseFloat(formData.cost_price) || 0,
          unit_price: parseFloat(formData.unit_price),
        } as any)

      if (error) throw error

      toast({
        title: "Success",
        description: "Product added successfully",
        // @ts-ignore
        variant: "success",
      })

      setIsAddDialogOpen(false)
      setFormData({ name: "", description: "", cost_price: "", unit_price: "" })
      setPercentage("50")
      loadProducts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = async () => {
    try {
      if (!selectedProduct) return

      const { error } = await (supabase as any)
        .from('products')
        .update({
          name: formData.name,
          description: formData.description || null,
          cost_price: parseFloat(formData.cost_price) || 0,
          unit_price: parseFloat(formData.unit_price),
        } as any)
        .eq('id', selectedProduct.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Product updated successfully",
        // @ts-ignore
        variant: "success",
      })

      setIsEditDialogOpen(false)
      setSelectedProduct(null)
      setFormData({ name: "", description: "", cost_price: "", unit_price: "" })
      setPercentage("50")
      loadProducts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Product deleted successfully",
        // @ts-ignore
        variant: "success",
      })

      loadProducts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      cost_price: product.cost_price?.toString() || "0",
      unit_price: product.unit_price.toString(),
    })
    setIsEditDialogOpen(true)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <LoadingPage text="Loading products..." />
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-8 w-8 text-blue-600" />
          Products
        </h1>
        <p className="text-gray-600 mt-1">Manage your product catalog</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Product List</CardTitle>
              <CardDescription>Add and manage products for your invoices</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>Create a new product for your catalog</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Web Design Service"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional product description"
                      rows={3}
                    />
                  </div>
                  {/* Pricing Calculator */}
                  <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Pricing Calculator</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cost_price">Cost Price *</Label>
                      <Input
                        id="cost_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cost_price}
                        onChange={(e) => {
                          const cost = e.target.value
                          setFormData({ ...formData, cost_price: cost })
                          if (pricingMode !== 'manual' && cost) {
                            const price = calculateSellingPrice(
                              parseFloat(cost),
                              pricingMode,
                              parseFloat(percentage)
                            )
                            setFormData(prev => ({ ...prev, unit_price: price.toFixed(2) }))
                          }
                        }}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pricing_mode">Pricing Method</Label>
                      <Select value={pricingMode} onValueChange={(value: PricingMode) => {
                        setPricingMode(value)
                        if (value !== 'manual' && formData.cost_price) {
                          const price = calculateSellingPrice(
                            parseFloat(formData.cost_price),
                            value,
                            parseFloat(percentage)
                          )
                          setFormData(prev => ({ ...prev, unit_price: price.toFixed(2) }))
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="markup">By Markup %</SelectItem>
                          <SelectItem value="margin">By Margin %</SelectItem>
                          <SelectItem value="manual">Manual Price</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {pricingMode !== 'manual' && (
                      <div className="space-y-2">
                        <Label htmlFor="percentage">
                          {pricingMode === 'markup' ? 'Markup %' : 'Margin %'}
                        </Label>
                        <Input
                          id="percentage"
                          type="number"
                          step="1"
                          min="0"
                          max={pricingMode === 'margin' ? "99" : undefined}
                          value={percentage}
                          onChange={(e) => {
                            setPercentage(e.target.value)
                            if (formData.cost_price) {
                              const price = calculateSellingPrice(
                                parseFloat(formData.cost_price),
                                pricingMode,
                                parseFloat(e.target.value)
                              )
                              setFormData(prev => ({ ...prev, unit_price: price.toFixed(2) }))
                            }
                          }}
                          placeholder="50"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="unit_price">Selling Price *</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        placeholder="0.00"
                        disabled={pricingMode !== 'manual'}
                        className={pricingMode !== 'manual' ? 'bg-gray-100' : ''}
                      />
                    </div>

                    {formData.cost_price && formData.unit_price && (
                      (() => {
                        const calc = calculatePricing(
                          parseFloat(formData.cost_price),
                          parseFloat(formData.unit_price)
                        )
                        return (
                          <div className="p-3 bg-white rounded-lg border space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Profit:</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(calc.profit, 'MYR')}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Margin:</span>
                              <span className="font-medium">{calc.profitMargin.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Markup:</span>
                              <span className="font-medium">{calc.markup.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-sm text-gray-600">Status:</span>
                              <span className={`text-sm font-semibold ${
                                calc.marginHealth === 'healthy' ? 'text-green-600' :
                                calc.marginHealth === 'acceptable' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {calc.marginHealth === 'healthy' ? '● Healthy Margin' :
                                 calc.marginHealth === 'acceptable' ? '● Acceptable' :
                                 '● Low Margin'}
                              </span>
                            </div>
                          </div>
                        )
                      })()
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddProduct}
                    disabled={!formData.name || !formData.unit_price}
                  >
                    Add Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Products Table */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No products</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? "No products match your search." : "Get started by creating a new product."}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.description ? (
                          <span className="text-gray-600 line-clamp-2">{product.description}</span>
                        ) : (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(product.unit_price, 'MYR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Web Design Service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional product description"
                rows={3}
              />
            </div>
            {/* Pricing Calculator */}
            <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Pricing Calculator</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cost_price">Cost Price *</Label>
                <Input
                  id="edit-cost_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={(e) => {
                    const cost = e.target.value
                    setFormData({ ...formData, cost_price: cost })
                    if (pricingMode !== 'manual' && cost) {
                      const price = calculateSellingPrice(
                        parseFloat(cost),
                        pricingMode,
                        parseFloat(percentage)
                      )
                      setFormData(prev => ({ ...prev, unit_price: price.toFixed(2) }))
                    }
                  }}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-pricing_mode">Pricing Method</Label>
                <Select value={pricingMode} onValueChange={(value: PricingMode) => {
                  setPricingMode(value)
                  if (value !== 'manual' && formData.cost_price) {
                    const price = calculateSellingPrice(
                      parseFloat(formData.cost_price),
                      value,
                      parseFloat(percentage)
                    )
                    setFormData(prev => ({ ...prev, unit_price: price.toFixed(2) }))
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markup">By Markup %</SelectItem>
                    <SelectItem value="margin">By Margin %</SelectItem>
                    <SelectItem value="manual">Manual Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pricingMode !== 'manual' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-percentage">
                    {pricingMode === 'markup' ? 'Markup %' : 'Margin %'}
                  </Label>
                  <Input
                    id="edit-percentage"
                    type="number"
                    step="1"
                    min="0"
                    max={pricingMode === 'margin' ? "99" : undefined}
                    value={percentage}
                    onChange={(e) => {
                      setPercentage(e.target.value)
                      if (formData.cost_price) {
                        const price = calculateSellingPrice(
                          parseFloat(formData.cost_price),
                          pricingMode,
                          parseFloat(e.target.value)
                        )
                        setFormData(prev => ({ ...prev, unit_price: price.toFixed(2) }))
                      }
                    }}
                    placeholder="50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-unit_price">Selling Price *</Label>
                <Input
                  id="edit-unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="0.00"
                  disabled={pricingMode !== 'manual'}
                  className={pricingMode !== 'manual' ? 'bg-gray-100' : ''}
                />
              </div>

              {formData.cost_price && formData.unit_price && (
                (() => {
                  const calc = calculatePricing(
                    parseFloat(formData.cost_price),
                    parseFloat(formData.unit_price)
                  )
                  return (
                    <div className="p-3 bg-white rounded-lg border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Profit:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(calc.profit, 'MYR')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Margin:</span>
                        <span className="font-medium">{calc.profitMargin.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Markup:</span>
                        <span className="font-medium">{calc.markup.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-sm font-semibold ${
                          calc.marginHealth === 'healthy' ? 'text-green-600' :
                          calc.marginHealth === 'acceptable' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {calc.marginHealth === 'healthy' ? '● Healthy Margin' :
                           calc.marginHealth === 'acceptable' ? '● Acceptable' :
                           '● Low Margin'}
                        </span>
                      </div>
                    </div>
                  )
                })()
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditProduct}
              disabled={!formData.name || !formData.unit_price}
            >
              Update Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
