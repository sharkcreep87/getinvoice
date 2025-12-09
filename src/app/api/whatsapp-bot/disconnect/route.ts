/**
 * POST /api/whatsapp-bot/disconnect
 *
 * Disconnect WhatsApp bot and clean up session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import WhatsAppBotClient from '@/lib/whatsapp-bot/client'

export async function POST(request: NextRequest) {
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

    // Get bot instance
    const botClient = WhatsAppBotClient.getInstance({
      userId: user.id,
    })

    // Disconnect bot
    await botClient.disconnect()

    // Update database
    const { error: updateError } = await supabase
      .from('whatsapp_bot_sessions')
      .update({
        status: 'disconnected',
        disconnected_at: new Date().toISOString(),
        qr_code: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[API] Failed to update session on disconnect:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Bot disconnected successfully',
    })
  } catch (error: any) {
    console.error('[API] Disconnect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect bot' },
      { status: 500 }
    )
  }
}
