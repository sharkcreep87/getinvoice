'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { MessageCircle, Save, AlertCircle } from 'lucide-react'
import { formatPhoneForDisplay, isValidPhoneNumber } from '@/lib/whatsapp/phone-formatter'

type WhatsAppSettingsProps = {
  whatsappNumber: string
  whatsappEnabled: boolean
  whatsappOrderTemplate: string
  onNumberChange: (number: string) => void
  onEnabledChange: (enabled: boolean) => void
  onTemplateChange: (template: string) => void
}

export function WhatsAppSettings({
  whatsappNumber,
  whatsappEnabled,
  whatsappOrderTemplate,
  onNumberChange,
  onEnabledChange,
  onTemplateChange,
}: WhatsAppSettingsProps) {
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const handlePhoneChange = (value: string) => {
    onNumberChange(value)

    if (value && !isValidPhoneNumber(value)) {
      setPhoneError('Please enter a valid phone number')
    } else {
      setPhoneError(null)
    }
  }

  const defaultTemplate = `Hi! I would like to place an order:

Order ID: {{order_id}}
{{items}}

Subtotal: {{subtotal}}
Tax: {{tax}}
Total: {{total}}

Order Link: {{order_link}}`

  const handleResetTemplate = () => {
    onTemplateChange(defaultTemplate)
  }

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <MessageCircle className="h-5 w-5" />
              WhatsApp Integration
            </CardTitle>
            <CardDescription className="mt-1">
              Enable customers to place orders via WhatsApp
            </CardDescription>
          </div>
          <Switch
            checked={whatsappEnabled}
            onCheckedChange={onEnabledChange}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* WhatsApp Business Number */}
        <div>
          <Label htmlFor="whatsapp_number" className="text-base font-semibold">
            WhatsApp Business Number *
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Enter your business WhatsApp number (with country code, e.g., 60123456789)
          </p>
          <Input
            id="whatsapp_number"
            type="tel"
            value={whatsappNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="60123456789"
            className={`mt-1.5 ${phoneError ? 'border-red-500' : ''}`}
          />
          {phoneError && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {phoneError}
            </p>
          )}
          {whatsappNumber && !phoneError && (
            <p className="text-sm text-green-600 mt-1">
              Display format: {formatPhoneForDisplay(whatsappNumber)}
            </p>
          )}
        </div>

        {/* Message Template */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="whatsapp_template" className="text-base font-semibold">
              Order Message Template
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetTemplate}
              className="text-xs"
            >
              Reset to Default
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Customize the message customers see when ordering via WhatsApp
          </p>
          <Textarea
            id="whatsapp_template"
            value={whatsappOrderTemplate}
            onChange={(e) => onTemplateChange(e.target.value)}
            placeholder={defaultTemplate}
            className="mt-1.5 min-h-[200px] font-mono text-sm"
          />
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-1">Available Placeholders:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
              <code>{'{{order_id}}'}</code>
              <code>{'{{order_number}}'}</code>
              <code>{'{{items}}'}</code>
              <code>{'{{subtotal}}'}</code>
              <code>{'{{tax}}'}</code>
              <code>{'{{tax_rate}}'}</code>
              <code>{'{{discount}}'}</code>
              <code>{'{{total}}'}</code>
              <code>{'{{order_link}}'}</code>
              <code>{'{{customer_name}}'}</code>
              <code>{'{{company_name}}'}</code>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            How it works:
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
            <li>Customers see "Order via WhatsApp" button on order pages</li>
            <li>Clicking opens WhatsApp with pre-filled order details</li>
            <li>Order is sent to your WhatsApp business number</li>
            <li>You receive notification and can process the order</li>
            <li>Send payment link or invoice back to customer</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
