'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QRCodeDisplay } from '@/components/whatsapp-bot/qr-code-display'
import { BotStatusBadge } from '@/components/whatsapp-bot/bot-status-badge'
import { MessageSquare, Calendar, CreditCard, BookOpen, Settings, TrendingUp } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export default function WhatsAppBotPage() {
  const [botStatus, setBotStatus] = useState<any>('disconnected')
  const [todayStats, setTodayStats] = useState({
    messages: 0,
    conversations: 0,
    aiUsage: 0,
    aiLimit: 1000,
  })

  // Fetch today's activity stats
  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      // Fetch stats in parallel
      const [messagesResult, conversationsResult, aiMessagesResult, profileResult] = await Promise.all([
        supabase
          .from('whatsapp_messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', todayISO),
        supabase
          .from('whatsapp_conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('last_message_at', todayISO),
        supabase
          .from('whatsapp_messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('ai_processed', true)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single(),
      ])

      // Determine AI limit based on subscription tier
      const tier = (profileResult.data as any)?.subscription_tier || 'free'
      const limits: Record<string, number> = {
        free: 50,
        basic: 500,
        pro: Infinity,
      }
      const aiLimit = limits[tier] || 50

      setTodayStats({
        messages: messagesResult.count || 0,
        conversations: conversationsResult.count || 0,
        aiUsage: aiMessagesResult.count || 0,
        aiLimit: aiLimit === Infinity ? 999999 : aiLimit,
      })
    }

    if (botStatus === 'ready') {
      fetchStats()
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [botStatus])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">WhatsApp AI Marketing Bot</h1>
          <p className="text-slate-600 mt-1">
            Automate customer support, bookings, and payments via WhatsApp
          </p>
        </div>
        <BotStatusBadge onStatusChange={setBotStatus} showDisconnectButton={true} />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - QR Code & Setup */}
        <div className="lg:col-span-2 space-y-6">
          {/* QR Code Section */}
          <QRCodeDisplay
            onScanSuccess={() => {
              console.log('Bot connected successfully!')
            }}
          />

          {/* Features Overview */}
          {botStatus === 'ready' && (
            <Card>
              <CardHeader>
                <CardTitle>Bot Features</CardTitle>
                <CardDescription>
                  Your AI bot can handle these tasks automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex gap-3 p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <MessageSquare className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900">AI Product Q&A</h3>
                      <p className="text-sm text-slate-600">
                        Answer customer questions about products using OpenAI
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <Calendar className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Appointment Booking</h3>
                      <p className="text-sm text-slate-600">
                        Let customers book appointments through chat
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <CreditCard className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Payment Links</h3>
                      <p className="text-sm text-slate-600">
                        Send Stripe payment links directly in chat
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <BookOpen className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Knowledge Base</h3>
                      <p className="text-sm text-slate-600">
                        Auto-synced product catalog + custom FAQs
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Column - Quick Stats & Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          {botStatus === 'ready' ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Messages</span>
                    <span className="text-2xl font-bold text-slate-900">{todayStats.messages}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Conversations</span>
                    <span className="text-2xl font-bold text-slate-900">{todayStats.conversations}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">AI Responses</span>
                    <span className="text-2xl font-bold text-slate-900">{todayStats.aiUsage}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-slate-500">
                      Statistics update automatically every 30 seconds
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    AI Usage (This Month)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">OpenAI API Calls</span>
                      <span className="font-semibold">
                        {todayStats.aiUsage} / {todayStats.aiLimit === 999999 ? '∞' : todayStats.aiLimit}
                      </span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                          width: `${todayStats.aiLimit === 999999 ? 0 : Math.min((todayStats.aiUsage / todayStats.aiLimit) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-600">
                      {todayStats.aiLimit === 999999 ? 'Unlimited AI quota (Pro plan)' : 'Your AI quota resets monthly'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Get Started</CardTitle>
                <CardDescription>Follow these steps to activate your bot</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span className="text-slate-700">
                      Click "Generate QR Code" to start
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span className="text-slate-700">
                      Open WhatsApp on your phone
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span className="text-slate-700">
                      Go to Settings → Linked Devices
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <span className="text-slate-700">
                      Scan the QR code
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      5
                    </span>
                    <span className="text-slate-700">
                      Your bot is now active! 🎉
                    </span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Bot Not Connecting?</h4>
                <p className="text-slate-600">
                  Make sure WhatsApp is open on your phone and you have a stable internet connection.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">QR Code Expired?</h4>
                <p className="text-slate-600">
                  Click the "Refresh QR Code" button to generate a new one. QR codes expire after 1 minute.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Best Practices</h4>
                <ul className="text-slate-600 space-y-1 ml-4 list-disc">
                  <li>Use a dedicated business WhatsApp number</li>
                  <li>Keep your phone connected to the internet</li>
                  <li>Don't logout from WhatsApp Web manually</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
