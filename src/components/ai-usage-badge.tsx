'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Zap, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AIUsageData = {
  used: number
  limit: number
  remaining: number
}

export function AIUsageBadge() {
  const [usage, setUsage] = useState<AIUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current usage
      const { data: currentUsage } = await (supabase as any)
        .rpc('get_total_today_ai_usage', { p_user_id: user.id })

      // Get limit from admin settings
      const { data: adminSettings } = await (supabase as any)
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'daily_ai_request_limit')
        .single()

      const limit = adminSettings?.setting_value
        ? parseInt(adminSettings.setting_value)
        : 5

      setUsage({
        used: currentUsage || 0,
        limit,
        remaining: limit - (currentUsage || 0)
      })
    } catch (error) {
      console.error('Failed to load AI usage:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !usage) {
    return null
  }

  const percentUsed = (usage.used / usage.limit) * 100
  const isNearLimit = percentUsed >= 80
  const isAtLimit = usage.remaining <= 0

  return (
    <Badge
      variant={isAtLimit ? 'destructive' : isNearLimit ? 'secondary' : 'default'}
      className="flex items-center gap-1.5"
      title={`Used: ${usage.used} / ${usage.limit} requests today`}
    >
      {isAtLimit ? (
        <AlertCircle className="h-3 w-3" />
      ) : (
        <Zap className="h-3 w-3" />
      )}
      <span>
        {usage.remaining} AI {usage.remaining === 1 ? 'request' : 'requests'} left
      </span>
    </Badge>
  )
}
