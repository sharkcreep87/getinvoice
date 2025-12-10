/**
 * WhatsApp Bot Client - Singleton Service
 *
 * Manages WhatsApp Web.js client lifecycle:
 * - QR code generation and authentication
 * - Session persistence to Supabase Storage
 * - Connection state management
 * - Automatic reconnection
 * - Health monitoring
 */

import { Client, LocalAuth, Message } from 'whatsapp-web.js'
import { createServerClient } from '@/lib/supabase/server'
import qrcode from 'qrcode-terminal'

export type BotStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'authenticated' | 'ready' | 'error'

export interface BotSession {
  sessionId: string
  phoneNumber: string | null
  status: BotStatus
  qrCode: string | null
  errorMessage: string | null
}

export interface WhatsAppBotConfig {
  userId: string
  onQRCode?: (qr: string) => void
  onReady?: (phoneNumber: string) => void
  onMessage?: (message: Message) => void
  onDisconnected?: (reason?: string) => void
  onError?: (error: Error) => void
}

class WhatsAppBotClient {
  private static instances: Map<string, WhatsAppBotClient> = new Map()
  private client: Client | null = null
  private config: WhatsAppBotConfig
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private isInitializing = false

  private constructor(config: WhatsAppBotConfig) {
    this.config = config
  }

  /**
   * Get or create bot instance for user
   */
  public static getInstance(config: WhatsAppBotConfig): WhatsAppBotClient {
    const existingInstance = WhatsAppBotClient.instances.get(config.userId)
    if (existingInstance) {
      // Update config but keep the same instance
      existingInstance.config = config
      return existingInstance
    }

    const newInstance = new WhatsAppBotClient(config)
    WhatsAppBotClient.instances.set(config.userId, newInstance)
    return newInstance
  }

  /**
   * Initialize WhatsApp client and start authentication
   */
  public async initialize(): Promise<void> {
    if (this.isInitializing) {
      console.log(`[Bot ${this.config.userId}] Already initializing...`)
      return
    }

    if (this.client) {
      console.log(`[Bot ${this.config.userId}] Client already exists`)
      return
    }

    this.isInitializing = true
    console.log(`[Bot ${this.config.userId}] Starting initialization...`)

    try {
      // Try to update session status, but don't fail if it errors
      try {
        console.log(`[Bot ${this.config.userId}] Updating session status to 'connecting'...`)
        await this.updateSessionStatus('connecting')
        console.log(`[Bot ${this.config.userId}] Session status updated`)
      } catch (dbError) {
        console.error(`[Bot ${this.config.userId}] Failed to update session to connecting, continuing anyway:`, dbError)
      }

      console.log(`[Bot ${this.config.userId}] Creating WhatsApp client...`)

      // Create WhatsApp Web.js client with local auth
      // Try to use system Chrome on macOS
      const chromeExecutablePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
      ]

      let executablePath: string | undefined
      const fs = require('fs')
      for (const path of chromeExecutablePaths) {
        if (fs.existsSync(path)) {
          executablePath = path
          console.log(`[Bot ${this.config.userId}] Using Chrome at: ${path}`)
          break
        }
      }

      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: `whatsapp-bot-${this.config.userId}`,
          dataPath: `./.wwebjs_auth/session-${this.config.userId}`,
        }),
        puppeteer: {
          headless: true,
          executablePath, // Use system Chrome if found
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        },
      })

      console.log(`[Bot ${this.config.userId}] WhatsApp client created, setting up event handlers...`)
      this.setupEventHandlers()

      console.log(`[Bot ${this.config.userId}] Initializing WhatsApp client (this may take 30-60 seconds)...`)

      // Add timeout to prevent hanging indefinitely
      const initPromise = this.client.initialize()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Initialization timeout after 60 seconds')), 60000)
      })

      await Promise.race([initPromise, timeoutPromise])

      console.log(`[Bot ${this.config.userId}] WhatsApp client initialized successfully`)
    } catch (error) {
      console.error(`[Bot ${this.config.userId}] Initialization error:`, error)
      try {
        await this.updateSessionStatus('error', error instanceof Error ? error.message : 'Unknown error')
      } catch (dbError) {
        console.error(`[Bot ${this.config.userId}] Failed to update error status:`, dbError)
      }
      this.config.onError?.(error instanceof Error ? error : new Error('Unknown error'))
      this.isInitializing = false
      this.client = null // Clean up failed client
      throw error
    }
  }

  /**
   * Setup event handlers for WhatsApp client
   */
  private setupEventHandlers(): void {
    if (!this.client) return

    console.log(`[Bot ${this.config.userId}] Setting up event handlers...`)

    // Loading screen (Puppeteer starting)
    this.client.on('loading_screen', (percent: number, message: string) => {
      console.log(`[Bot ${this.config.userId}] Loading: ${percent}% - ${message}`)
    })

    // QR Code received
    this.client.on('qr', async (qr: string) => {
      console.log(`[Bot ${this.config.userId}] QR Code received`)

      // Display QR in terminal for debugging
      qrcode.generate(qr, { small: true })

      // Update database with QR code
      await this.updateSessionStatus('qr_ready', null, qr)

      // Call callback
      this.config.onQRCode?.(qr)
    })

    // Authenticated
    this.client.on('authenticated', async () => {
      console.log(`[Bot ${this.config.userId}] Authenticated`)
      await this.updateSessionStatus('authenticated')
    })


    // Ready
    this.client.on('ready', async () => {
      console.log(`[Bot ${this.config.userId}] Client is ready!`)

      // Get phone number
      const info = this.client!.info
      const phoneNumber = info?.wid?.user || 'unknown'

      console.log(`[Bot ${this.config.userId}] Connected as: ${phoneNumber}`)

      // Update database
      await this.updateSessionStatus('ready', null, null, phoneNumber)

      // Reset reconnect attempts
      this.reconnectAttempts = 0
      this.isInitializing = false

      // Call callback
      this.config.onReady?.(phoneNumber)

      // Start heartbeat
      this.startHeartbeat()
    })

    // Message received
    this.client.on('message', async (message: Message) => {
      console.log(`[Bot ${this.config.userId}] Message from ${message.from}: ${message.body}`)

      // Call the onMessage callback (which will handle routing)
      this.config.onMessage?.(message)
    })

    // Disconnected
    this.client.on('disconnected', async (reason: string) => {
      console.log(`[Bot ${this.config.userId}] Disconnected:`, reason)
      await this.updateSessionStatus('disconnected')
      this.config.onDisconnected?.(reason)

      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(`[Bot ${this.config.userId}] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
        setTimeout(() => this.initialize(), 5000)
      } else {
        console.error(`[Bot ${this.config.userId}] Max reconnection attempts reached`)
        await this.updateSessionStatus('error', 'Max reconnection attempts reached')
      }
    })

    // Authentication failure
    this.client.on('auth_failure', async (message: string) => {
      console.error(`[Bot ${this.config.userId}] Authentication failure:`, message)
      await this.updateSessionStatus('error', `Authentication failed: ${message}`)
      this.config.onError?.(new Error(`Authentication failed: ${message}`))
      this.isInitializing = false
    })
  }

  /**
   * Update bot session status in database
   */
  private async updateSessionStatus(
    status: BotStatus,
    errorMessage: string | null = null,
    qrCode: string | null = null,
    phoneNumber: string | null = null
  ): Promise<void> {
    try {
      const supabase = await createServerClient()

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'ready' || status === 'authenticated') {
        updateData.connected_at = new Date().toISOString()
        updateData.last_heartbeat = new Date().toISOString()
      }

      if (status === 'disconnected') {
        updateData.disconnected_at = new Date().toISOString()
      }

      if (errorMessage) {
        updateData.error_message = errorMessage
      }

      if (qrCode) {
        updateData.qr_code = qrCode
        updateData.qr_expires_at = new Date(Date.now() + 60 * 1000).toISOString() // 1 minute expiry
      }

      if (phoneNumber) {
        updateData.phone_number = phoneNumber
      }

      console.log(`[Bot ${this.config.userId}] Upserting session with status: ${status}`)

      // Upsert session
      const { data, error } = await supabase
        .from('whatsapp_bot_sessions')
        .upsert({
          user_id: this.config.userId,
          ...updateData,
        } as any, {
          onConflict: 'user_id',
        })
        .select()

      if (error) {
        console.error(`[Bot ${this.config.userId}] Failed to update session:`, error)
        // Don't throw - log and continue
      } else {
        console.log(`[Bot ${this.config.userId}] Session updated successfully:`, data)
      }
    } catch (error) {
      console.error(`[Bot ${this.config.userId}] Error updating session status:`, error)
      // Don't throw - log and continue
    }
  }

  /**
   * Start heartbeat to keep session alive
   */
  private startHeartbeat(): void {
    setInterval(async () => {
      if (this.client && this.client.info) {
        await this.updateHeartbeat()
      }
    }, 60000) // Every 60 seconds
  }

  /**
   * Update last heartbeat timestamp
   */
  private async updateHeartbeat(): Promise<void> {
    try {
      const supabase = await createServerClient()
      await supabase
        .from('whatsapp_bot_sessions')
        // @ts-expect-error - Supabase type inference issue with strict mode
        .update({
          last_heartbeat: new Date().toISOString(),
        } as any)
        .eq('user_id', this.config.userId)
    } catch (error) {
      console.error(`[Bot ${this.config.userId}] Heartbeat error:`, error)
    }
  }

  /**
   * Send message to WhatsApp number
   */
  public async sendMessage(to: string, message: string): Promise<void> {
    if (!this.client || !this.client.info) {
      throw new Error('Bot is not ready')
    }

    // Format phone number (remove spaces, dashes, etc.)
    const formattedNumber = to.replace(/\D/g, '')

    // Add country code if not present (assume Malaysia +60)
    const phoneNumber = formattedNumber.startsWith('60') ? formattedNumber : `60${formattedNumber}`

    // Send message
    await this.client.sendMessage(`${phoneNumber}@c.us`, message)

    console.log(`[Bot ${this.config.userId}] Message sent to ${phoneNumber}`)
  }

  /**
   * Get bot status
   */
  public getStatus(): BotStatus {
    if (!this.client) return 'disconnected'
    if (this.client.info) return 'ready'
    return 'connecting'
  }

  /**
   * Check if bot is ready
   */
  public isReady(): boolean {
    return this.client !== null && this.client.info !== undefined
  }

  /**
   * Disconnect bot
   */
  public async disconnect(): Promise<void> {
    if (!this.client) return

    console.log(`[Bot ${this.config.userId}] Disconnecting...`)

    await this.client.destroy()
    this.client = null
    this.isInitializing = false

    await this.updateSessionStatus('disconnected')

    // Remove from instances
    WhatsAppBotClient.instances.delete(this.config.userId)
  }

  /**
   * Get client info
   */
  public getInfo(): any {
    return this.client?.info || null
  }

  /**
   * Get WhatsApp client (for advanced usage)
   */
  public getClient(): Client | null {
    return this.client
  }
}

export default WhatsAppBotClient
