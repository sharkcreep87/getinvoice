'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from '@/components/ui/animated-icons'
import { QrCode, RefreshCw } from 'lucide-react'
import QRCode from 'react-qr-code'

interface QRCodeDisplayProps {
  onScanSuccess?: () => void
}

export function QRCodeDisplay({ onScanSuccess }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('disconnected')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    fetchQRCode()

    // Poll for QR code updates every 3 seconds
    const interval = setInterval(() => {
      if (status !== 'ready' && status !== 'authenticated') {
        fetchQRCode()
      } else if (status === 'ready') {
        clearInterval(interval)
        onScanSuccess?.()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [status])

  const fetchQRCode = async (retries = 3): Promise<void> => {
    try {
      const response = await fetch('/api/whatsapp-bot/qr')
      const data = await response.json()

      if (!response.ok) {
        // If session not found and we have retries left, wait and try again
        if (retries > 0 && data.error?.includes('No bot session found')) {
          console.log(`Session not ready yet, retrying in 2 seconds... (${retries} retries left)`)
          setTimeout(() => fetchQRCode(retries - 1), 2000)
          return
        }
        throw new Error(data.error || 'Failed to fetch QR code')
      }

      setStatus(data.status)
      setQrCode(data.qr_code)
      setExpired(data.expired || false)
      setError(null)

      if (data.status === 'ready') {
        onScanSuccess?.()
      }
    } catch (err: any) {
      // Only set error if we're out of retries
      if (retries === 0) {
        setError(err.message)
      }
    }
  }

  const initializeBot = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/whatsapp-bot/init', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize bot')
      }

      setStatus(data.status)

      // Start polling for QR code (with longer initial delay)
      setTimeout(() => fetchQRCode(), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    initializeBot()
  }

  if (status === 'ready') {
    return (
      <Card className="border-2 border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <CardTitle className="text-green-800">Bot Connected!</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Your WhatsApp bot is active and ready to receive messages
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (status === 'connecting' && !qrCode) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 size={48} />
            <p className="text-slate-600">Initializing WhatsApp bot...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !qrCode) {
    return (
      <Card className="border-2 border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-800">Connection Error</CardTitle>
          <CardDescription className="text-red-700">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (qrCode && !expired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            Scan QR Code
          </CardTitle>
          <CardDescription>
            Open WhatsApp on your phone, go to Settings → Linked Devices → Link a Device, and scan this QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center p-8 bg-white rounded-lg border-2 border-primary/20">
            <QRCode value={qrCode} size={256} />
          </div>

          <div className="bg-beez-50 border border-beez-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-beez-900">Instructions:</p>
            <ol className="text-sm text-beez-800 space-y-1 ml-4 list-decimal">
              <li>Open WhatsApp on your phone</li>
              <li>Tap Menu or Settings</li>
              <li>Tap Linked Devices</li>
              <li>Tap "Link a Device"</li>
              <li>Scan this QR code</li>
            </ol>
          </div>

          <Button onClick={handleRefresh} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh QR Code
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Initial state - show initialize button
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect WhatsApp Bot</CardTitle>
        <CardDescription>
          Start your AI-powered WhatsApp bot to handle customer inquiries, bookings, and payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {expired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">QR code expired. Please generate a new one.</p>
          </div>
        )}

        <Button
          onClick={initializeBot}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="mr-2" />
              Initializing...
            </>
          ) : (
            <>
              <QrCode className="mr-2 h-5 w-5" />
              Generate QR Code
            </>
          )}
        </Button>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
          <p className="font-medium mb-2">What you can do with the bot:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>Answer customer questions about products using AI</li>
            <li>Accept appointment bookings</li>
            <li>Send payment links</li>
            <li>Automate customer support</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
