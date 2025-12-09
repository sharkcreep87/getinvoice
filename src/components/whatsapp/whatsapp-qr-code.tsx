'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, MessageCircle } from 'lucide-react'
import { generateOrderWhatsAppLink, type OrderMessageData } from '@/lib/whatsapp/link-generator'

type WhatsAppQRCodeProps = {
  businessPhone: string
  orderData: OrderMessageData
  size?: number
  showDownload?: boolean
  showCard?: boolean
  countryCode?: string
}

export function WhatsAppQRCode({
  businessPhone,
  orderData,
  size = 256,
  showDownload = true,
  showCard = true,
  countryCode,
}: WhatsAppQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrGenerated, setQrGenerated] = useState(false)

  useEffect(() => {
    if (canvasRef.current) {
      const whatsappLink = generateOrderWhatsAppLink(businessPhone, orderData, countryCode)

      QRCode.toCanvas(
        canvasRef.current,
        whatsappLink,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#166534', // Green-700
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) {
            console.error('Error generating QR code:', error)
          } else {
            setQrGenerated(true)
          }
        }
      )
    }
  }, [businessPhone, orderData, size, countryCode])

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `whatsapp-order-${orderData.orderNumber}.png`
      link.href = url
      link.click()
    }
  }

  const qrCodeElement = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas ref={canvasRef} className="rounded-lg shadow-lg border-4 border-green-600" />
        {!qrGenerated && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}
      </div>
      {showDownload && qrGenerated && (
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="gap-2 border-green-600 text-green-700 hover:bg-green-50"
        >
          <Download className="h-4 w-4" />
          Download QR Code
        </Button>
      )}
    </div>
  )

  if (!showCard) {
    return qrCodeElement
  }

  return (
    <Card className="border-2 border-green-600/20">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <MessageCircle className="h-5 w-5" />
          WhatsApp Order QR Code
        </CardTitle>
        <CardDescription>
          Scan this QR code with your phone to place the order via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 flex justify-center">
        {qrCodeElement}
      </CardContent>
    </Card>
  )
}

export function WhatsAppQRCodeSimple(props: WhatsAppQRCodeProps) {
  return <WhatsAppQRCode {...props} showCard={false} showDownload={false} />
}
