'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Check, Loader2, Package, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { WhatsAppOrderButton } from "@/components/whatsapp/whatsapp-order-button"
import { WhatsAppQRCode } from "@/components/whatsapp/whatsapp-qr-code"
import type { OrderMessageData } from "@/lib/whatsapp/message-templates"

type Product = {
  id: string
  name: string
  description: string | null
  unit_price: number
  stock: number | null
}

type ProductLink = {
  id: string
  user_id: string
  product_id: string | null
  link_type: 'product' | 'catalog'
  is_active: boolean
}

export default function PublicOrderPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [link, setLink] = useState<ProductLink | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    quantity: '1',
    notes: '',
  })
  const [whatsappSettings, setWhatsappSettings] = useState<{
    enabled: boolean
    number: string
    companyName: string
  } | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadLinkAndProducts()
  }, [token])

  const loadLinkAndProducts = async () => {
    try {
      // Increment view count
      await (supabase as any).rpc('increment_link_view_count', { link_token: token })

      // Get link details
      const { data: linkData, error: linkError } = await (supabase as any)
        .from('product_links')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .single()

      if (linkError || !linkData) {
        toast({
          title: "Invalid Link",
          description: "This order link is invalid or has been disabled.",
          variant: "destructive",
        })
        return
      }

      setLink(linkData)

      // Fetch company WhatsApp settings
      const { data: companyData } = await (supabase as any)
        .from('company_settings')
        .select('whatsapp_number, whatsapp_enabled, company_name')
        .eq('user_id', linkData.user_id)
        .single()

      if (companyData?.whatsapp_enabled && companyData?.whatsapp_number) {
        setWhatsappSettings({
          enabled: true,
          number: companyData.whatsapp_number,
          companyName: companyData.company_name || ''
        })
      }

      // Load products based on link type
      if (linkData.link_type === 'product') {
        // Single product link
        const { data: productData, error: productError } = await (supabase as any)
          .from('products')
          .select('id, name, description, unit_price, stock')
          .eq('id', linkData.product_id)
          .single()

        if (productError) throw productError
        setProducts([productData])
        setSelectedProduct(productData.id)
      } else {
        // Catalog link - load all products from this user
        const { data: productsData, error: productsError } = await (supabase as any)
          .from('products')
          .select('id, name, description, unit_price, stock')
          .eq('user_id', linkData.user_id)
          .order('name', { ascending: true })

        if (productsError) throw productsError
        setProducts(productsData || [])
      }
    } catch (error: any) {
      console.error('Load error:', error)
      toast({
        title: "Error",
        description: "Failed to load product information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (!link || !selectedProduct) {
        throw new Error("Please select a product")
      }

      const product = products.find(p => p.id === selectedProduct)
      if (!product) throw new Error("Product not found")

      const quantity = parseInt(formData.quantity)
      if (quantity <= 0) throw new Error("Quantity must be greater than 0")

      // Check stock if available
      if (product.stock !== null && product.stock < quantity) {
        throw new Error(`Only ${product.stock} units available in stock`)
      }

      const totalAmount = product.unit_price * quantity

      // Create order
      const { error } = await (supabase as any)
        .from('product_orders')
        .insert({
          user_id: link.user_id,
          product_id: selectedProduct,
          link_id: link.id,
          customer_name: formData.customer_name.trim(),
          customer_email: formData.customer_email.trim() || null,
          customer_phone: formData.customer_phone.trim() || null,
          customer_address: formData.customer_address.trim() || null,
          quantity,
          unit_price: product.unit_price,
          total_amount: totalAmount,
          status: 'pending',
          notes: formData.notes.trim() || null,
        })

      if (error) throw error

      // Increment order count
      await (supabase as any).rpc('increment_link_order_count', { link_token: token })

      setOrderSuccess(true)
      toast({
        title: "Order Placed!",
        description: "Your order has been submitted successfully. The seller will contact you soon.",
      })
    } catch (error: any) {
      console.error('Submit error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit order",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              This order link is invalid or has been disabled.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-center">Order Placed Successfully!</CardTitle>
            <CardDescription className="text-center">
              Thank you for your order. The seller will contact you soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium">{products.find(p => p.id === selectedProduct)?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{formData.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{formData.customer_name}</span>
              </div>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Place Another Order
            </Button>

            {/* WhatsApp Contact Button */}
            {whatsappSettings && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 text-center mb-3">
                  Have questions about your order?
                </p>
                <Button
                  onClick={() => {
                    const product = products.find(p => p.id === selectedProduct)
                    const message = `Hi! I just placed an order:\n\nOrder Details:\nProduct: ${product?.name}\nQuantity: ${formData.quantity}\nName: ${formData.customer_name}\n\nI would like to confirm my order.`
                    const encodedMessage = encodeURIComponent(message)
                    window.open(`https://wa.me/${whatsappSettings.number.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank')
                  }}
                  variant="outline"
                  className="w-full gap-2 border-green-600 text-green-700 hover:bg-green-50"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contact via WhatsApp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)
  const totalAmount = selectedProductData
    ? selectedProductData.unit_price * parseInt(formData.quantity || '1')
    : 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Place Your Order</CardTitle>
                <CardDescription>
                  {link.link_type === 'product' ? 'Fill in your details to order' : 'Choose a product and fill in your details'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection (for catalog links) */}
              {link.link_type === 'catalog' && (
                <div className="space-y-3">
                  <Label>Select Product *</Label>
                  <div className="grid gap-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => setSelectedProduct(product.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedProduct === product.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            {product.description && (
                              <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                            )}
                            {product.stock !== null && (
                              <p className="text-xs text-gray-500 mt-1">
                                Stock: {product.stock} units
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-primary">
                              RM {product.unit_price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Display (for single product links) */}
              {link.link_type === 'product' && selectedProductData && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-gray-900">Product Details</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium">{selectedProductData.name}</span>
                    </div>
                    {selectedProductData.description && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="font-medium text-sm">{selectedProductData.description}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per unit:</span>
                      <span className="font-bold text-primary">RM {selectedProductData.unit_price.toFixed(2)}</span>
                    </div>
                    {selectedProductData.stock !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-medium">{selectedProductData.stock} units</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  disabled={!selectedProduct}
                />
              </div>

              {/* Total Amount Display */}
              {selectedProduct && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">RM {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-gray-900">Your Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="customer_name">Full Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_email">Email</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer_phone">Phone Number</Label>
                    <Input
                      id="customer_phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="+60123456789"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_address">Delivery Address</Label>
                  <Textarea
                    id="customer_address"
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    placeholder="Your full delivery address"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special requests or notes"
                    rows={2}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !selectedProduct}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Place Order
                  </>
                )}
              </Button>
            </form>

            {/* WhatsApp Ordering Alternative */}
            {whatsappSettings && selectedProduct && formData.customer_name && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Or order via WhatsApp
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <MessageCircle className="h-5 w-5 text-green-700 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-900">Quick Order via WhatsApp</h3>
                        <p className="text-sm text-green-700 mt-1">
                          Click the button below or scan the QR code to send your order directly via WhatsApp
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        const product = selectedProductData
                        if (!product) return

                        const message = `Hi${whatsappSettings.companyName ? ` ${whatsappSettings.companyName}` : ''}! I would like to place an order:\n\n📋 *Order Details*\n\n*Product:* ${product.name}\n*Quantity:* ${formData.quantity}\n*Price per unit:* RM ${product.unit_price.toFixed(2)}\n*Total Amount:* RM ${totalAmount.toFixed(2)}\n\n*Customer Information:*\nName: ${formData.customer_name}\n${formData.customer_email ? `Email: ${formData.customer_email}\n` : ''}${formData.customer_phone ? `Phone: ${formData.customer_phone}\n` : ''}${formData.customer_address ? `Address: ${formData.customer_address}\n` : ''}${formData.notes ? `\nNotes: ${formData.notes}` : ''}\n\nThank you!`

                        const encodedMessage = encodeURIComponent(message)
                        const phoneNumber = whatsappSettings.number.replace(/\D/g, '')
                        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer')
                      }}
                      className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                      size="lg"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-semibold">Order via WhatsApp</span>
                    </Button>

                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-xs text-center text-green-700 mb-3">
                        Or scan this QR code with your phone
                      </p>
                      <div className="flex justify-center">
                        <WhatsAppQRCode
                          businessPhone={whatsappSettings.number}
                          orderData={{
                            orderId: link?.id || '',
                            orderNumber: `ORD-${Date.now()}`,
                            items: selectedProductData ? [{
                              name: selectedProductData.name,
                              quantity: parseInt(formData.quantity || '1'),
                              amount: totalAmount,
                              unit_price: selectedProductData.unit_price
                            }] : [],
                            subtotal: totalAmount,
                            tax: 0,
                            taxRate: 0,
                            total: totalAmount,
                            currency: 'RM',
                            customerName: formData.customer_name,
                            orderLink: window.location.href,
                            companyName: whatsappSettings.companyName
                          }}
                          size={200}
                          showDownload={false}
                          showCard={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
