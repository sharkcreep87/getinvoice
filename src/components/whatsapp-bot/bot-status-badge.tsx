'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Power, PowerOff, Loader2 } from 'lucide-react'

export type BotStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'authenticated' | 'ready' | 'error'

interface BotStatusBadgeProps {
  onStatusChange?: (status: BotStatus) => void
  showDisconnectButton?: boolean
}

export function BotStatusBadge({ onStatusChange, showDisconnectButton = false }: BotStatusBadgeProps) {
  const [status, setStatus] = useState<BotStatus>('disconnected')
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchStatus()

    // Poll for status updates every 5 seconds
    const interval = setInterval(fetchStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp-bot/status')
      const data = await response.json()

      if (response.ok) {
        setStatus(data.status)
        setPhoneNumber(data.phone_number)
        onStatusChange?.(data.status)
      }
    } catch (error) {
      console.error('Failed to fetch bot status:', error)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect the WhatsApp bot?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/whatsapp-bot/disconnect', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect')
      }

      toast({
        title: 'Bot Disconnected',
        description: 'WhatsApp bot has been disconnected successfully',
      })

      setStatus('disconnected')
      setPhoneNumber(null)
      onStatusChange?.('disconnected')
    } catch (error: any) {
      toast({
        title: 'Disconnect Failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
        return {
          label: 'Connected',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '●',
        }
      case 'authenticated':
        return {
          label: 'Authenticated',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '◐',
        }
      case 'qr_ready':
        return {
          label: 'Waiting for Scan',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: '○',
        }
      case 'connecting':
        return {
          label: 'Connecting',
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: '◐',
        }
      case 'error':
        return {
          label: 'Error',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '✕',
        }
      case 'disconnected':
      default:
        return {
          label: 'Disconnected',
          color: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: '○',
        }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className="flex items-center gap-3">
      <Badge className={`${statusConfig.color} border px-3 py-1 font-medium`}>
        <span className="mr-2">{statusConfig.icon}</span>
        {statusConfig.label}
        {phoneNumber && status === 'ready' && ` - ${phoneNumber}`}
      </Badge>

      {showDisconnectButton && status === 'ready' && (
        <Button
          onClick={handleDisconnect}
          disabled={loading}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:border-red-300"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Disconnecting...
            </>
          ) : (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              Disconnect
            </>
          )}
        </Button>
      )}
    </div>
  )
}
