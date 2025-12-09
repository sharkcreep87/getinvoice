/**
 * GET /api/whatsapp-bot/status
 *
 * Get WhatsApp bot status and connection info
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import WhatsAppBotClient from '@/lib/whatsapp-bot/client'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get bot session from database
    const { data: session, error } = await supabase
      .from('whatsapp_bot_sessions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !session) {
      return NextResponse.json({
        status: 'disconnected',
        phone_number: null,
        connected_at: null,
        last_heartbeat: null,
        settings: null,
        message: 'No bot session found',
      })
    }

    // Try to get runtime status from bot client
    const botClient = WhatsAppBotClient.getInstance({
      userId: user.id,
    })

    const runtimeStatus = botClient.isReady() ? 'ready' : session.status

    return NextResponse.json({
      status: runtimeStatus,
      phone_number: session.phone_number,
      connected_at: session.connected_at,
      disconnected_at: session.disconnected_at,
      last_heartbeat: session.last_heartbeat,
      error_message: session.error_message,
      settings: session.settings,
      is_ready: botClient.isReady(),
    })
  } catch (error: any) {
    console.error('[API] Status fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
