'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, ExternalLink } from 'lucide-react'
import { generateOrderWhatsAppLink, type OrderMessageData } from '@/lib/whatsapp/link-generator'
import { cn } from '@/lib/utils'

type WhatsAppOrderButtonProps = {
  businessPhone: string
  orderData: OrderMessageData
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  showIcon?: boolean
  text?: string
  fullWidth?: boolean
  countryCode?: string
}

export function WhatsAppOrderButton({
  businessPhone,
  orderData,
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  text = 'Order via WhatsApp',
  fullWidth = false,
  countryCode,
}: WhatsAppOrderButtonProps) {
  const handleWhatsAppOrder = () => {
    const whatsappLink = generateOrderWhatsAppLink(businessPhone, orderData, countryCode)
    window.open(whatsappLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      onClick={handleWhatsAppOrder}
      variant={variant}
      size={size}
      className={cn(
        'gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all',
        fullWidth && 'w-full',
        className
      )}
    >
      {showIcon && <MessageCircle className="h-5 w-5" />}
      <span className="font-semibold">{text}</span>
      <ExternalLink className="h-4 w-4 opacity-70" />
    </Button>
  )
}

export function WhatsAppOrderButtonOutline(props: Omit<WhatsAppOrderButtonProps, 'variant'>) {
  return (
    <WhatsAppOrderButton
      {...props}
      variant="outline"
      className={cn(
        'border-2 border-green-600 text-green-700 hover:bg-green-50 hover:border-green-700',
        props.className
      )}
    />
  )
}

export function WhatsAppOrderButtonLarge(props: WhatsAppOrderButtonProps) {
  return (
    <WhatsAppOrderButton
      {...props}
      size="lg"
      fullWidth
      className={cn('py-6 text-lg', props.className)}
    />
  )
}
