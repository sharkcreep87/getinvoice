/**
 * POST /api/whatsapp-bot/init
 *
 * Initialize WhatsApp bot for authenticated user
 * Starts the bot client and begins QR code generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import WhatsAppBotClient from '@/lib/whatsapp-bot/client'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] WhatsApp bot init request received')

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[API] Auth failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[API] User authenticated: ${user.id}`)

    // Check if user has an active subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single() as { data: { subscription_tier: string } | null; error: any }

    console.log('[API] Profile data:', profile)
    console.log('[API] Profile error:', profileError)

    if (!profile || profile.subscription_tier === 'free') {
      console.log('[API] Subscription check failed - tier:', profile?.subscription_tier)
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      )
    }

    console.log(`[API] Subscription check passed - tier: ${profile.subscription_tier}`)

    // Get or create bot instance
    console.log('[API] Creating bot instance...')
    const botClient = WhatsAppBotClient.getInstance({
      userId: user.id,
      onQRCode: (qr) => {
        console.log(`[API] QR Code generated for user ${user.id}`)
      },
      onReady: (phoneNumber) => {
        console.log(`[API] Bot ready for user ${user.id}: ${phoneNumber}`)
      },
      onMessage: async (message) => {
        console.log(`[API] Message received for user ${user.id}`)
        // Message handling will be implemented in Phase 2
      },
      onDisconnected: (reason) => {
        console.log(`[API] Bot disconnected for user ${user.id}:`, reason)
      },
      onError: (error) => {
        console.error(`[API] Bot error for user ${user.id}:`, error)
      },
    })

    console.log('[API] Bot instance created, starting initialization...')

    // Initialize bot (async, will generate QR code)
    await botClient.initialize()

    console.log('[API] Bot initialization completed, status:', botClient.getStatus())

    return NextResponse.json({
      success: true,
      message: 'Bot initialization started. Check /api/whatsapp-bot/qr for QR code.',
      status: botClient.getStatus(),
    })
  } catch (error: any) {
    console.error('[API] Bot initialization error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize bot' },
      { status: 500 }
    )
  }
}
