/**
 * GET /api/whatsapp-bot/debug
 * 
 * Debug endpoint to check WhatsApp bot prerequisites
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const diagnostics: any = {
            timestamp: new Date().toISOString(),
            checks: {},
            errors: [],
        }

        // Check 1: Authentication
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        diagnostics.checks.authentication = {
            passed: !authError && !!user,
            userId: user?.id || null,
            error: authError?.message || null,
        }

        if (!user) {
            diagnostics.errors.push('Not authenticated')
            return NextResponse.json(diagnostics)
        }

        // Check 2: Profile & Subscription
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_tier, email')
            .eq('id', user.id)
            .single() as { data: any; error: any }

        diagnostics.checks.profile = {
            passed: !profileError && !!profile,
            subscriptionTier: profile?.subscription_tier || null,
            email: profile?.email || null,
            error: profileError?.message || null,
        }

        if (!profile || profile.subscription_tier === 'free') {
            diagnostics.errors.push('Subscription tier is free or not set')
        }

        // Check 3: Existing Session
        const { data: session, error: sessionError } = await supabase
            .from('whatsapp_bot_sessions')
            .select('*')
            .eq('user_id', user.id)
            .single() as { data: any; error: any }

        diagnostics.checks.existingSession = {
            passed: !sessionError,
            status: session?.status || null,
            hasQrCode: !!session?.qr_code,
            error: sessionError?.message || null,
        }

        // Check 4: Environment
        diagnostics.checks.environment = {
            isServerless: !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
            nodeVersion: process.version,
            platform: process.platform,
        }

        // Check 5: Puppeteer
        try {
            const puppeteer = require('puppeteer')
            const execPath = puppeteer.executablePath()
            diagnostics.checks.puppeteer = {
                passed: true,
                executablePath: execPath,
            }
        } catch (error: any) {
            diagnostics.checks.puppeteer = {
                passed: false,
                error: error.message,
            }
            diagnostics.errors.push('Puppeteer not available')
        }

        // Summary
        diagnostics.summary = {
            allChecksPassed: diagnostics.errors.length === 0,
            totalErrors: diagnostics.errors.length,
            canInitialize: diagnostics.errors.length === 0 && !diagnostics.checks.environment.isServerless,
        }

        return NextResponse.json(diagnostics, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack,
        }, { status: 500 })
    }
}
