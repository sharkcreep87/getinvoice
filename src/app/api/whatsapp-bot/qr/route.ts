/**
 * GET /api/whatsapp-bot/qr
 *
 * Get QR code for WhatsApp authentication
 * Returns the latest QR code from database
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[API] QR code fetch request received')

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[API] QR fetch - Auth failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[API] QR fetch - User authenticated: ${user.id}`)

    // Get bot session from database
    const { data: session, error } = await supabase
      .from('whatsapp_bot_sessions')
      .select('*')
      .eq('user_id', user.id)
      .single() as { data: any | null; error: any }

    console.log('[API] QR fetch - Session data:', session)
    console.log('[API] QR fetch - Session error:', error)

    if (error || !session) {
      console.log('[API] QR fetch - No session found for user:', user.id)
      return NextResponse.json(
        { error: 'No bot session found. Please initialize first.' },
        { status: 404 }
      )
    }

    // Check if QR code is still valid
    if (session.qr_code && session.qr_expires_at) {
      const expiresAt = new Date(session.qr_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json({
          status: session.status,
          qr_code: null,
          expired: true,
          message: 'QR code expired. Please reinitialize bot.',
        })
      }
    }

    return NextResponse.json({
      status: session.status,
      qr_code: session.qr_code,
      phone_number: session.phone_number,
      expires_at: session.qr_expires_at,
      expired: false,
    })
  } catch (error: any) {
    console.error('[API] QR fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch QR code' },
      { status: 500 }
    )
  }
}
