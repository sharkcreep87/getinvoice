/**
 * Message Router
 *
 * Routes incoming WhatsApp messages to appropriate handlers based on intent
 */

import type { Message } from 'whatsapp-web.js'
import { detectIntent } from './intent-detector'
import { handleAIQuery } from './ai-handler'
import { createServerClient } from '@/lib/supabase/server'

export interface MessageContext {
  userId: string
  message: Message
  customerPhone: string
  customerName: string
}

/**
 * Route incoming message to appropriate handler
 */
export async function routeMessage(context: MessageContext): Promise<string | null> {
  try {
    const { message, userId, customerPhone, customerName } = context
    const messageBody = message.body.trim()

    console.log(`[Router] Processing message from ${customerPhone}: "${messageBody}"`)

    // Detect intent
    const intent = detectIntent(messageBody)
    console.log(`[Router] Detected intent: ${intent}`)

    // Save message to database
    await saveMessage({
      userId,
      customerPhone,
      messageBody,
      intent,
      direction: 'inbound',
    })

    // Get or create conversation
    const conversation = await getOrCreateConversation(userId, customerPhone, customerName)

    // Route based on intent
    switch (intent) {
      case 'greeting':
        return handleGreeting(customerName)

      case 'product_query':
      case 'general':
        // Use AI handler for product queries and general questions
        return await handleAIQuery({
          userId,
          conversationId: conversation.id,
          customerPhone,
          messageBody,
        })

      case 'help':
        return handleHelp()

      default:
        // Fallback to AI handler
        return await handleAIQuery({
          userId,
          conversationId: conversation.id,
          customerPhone,
          messageBody,
        })
    }
  } catch (error) {
    console.error('[Router] Error routing message:', error)
    return "Sorry, I encountered an error processing your message. Please try again."
  }
}

/**
 * Handle greeting messages
 */
function handleGreeting(customerName: string): string {
  const greetings = [
    `Hi ${customerName}! 👋 Welcome! How can I help you today?`,
    `Hello ${customerName}! Thanks for reaching out. What can I do for you?`,
    `Hey ${customerName}! Great to hear from you. How may I assist?`,
  ]
  return greetings[Math.floor(Math.random() * greetings.length)]
}

/**
 * Handle help messages
 */
function handleHelp(): string {
  return `I can help you with:

📦 Product information - Ask about our products
📅 Appointment booking - Schedule a meeting
💳 Payments - Get payment links
❓ General questions - Ask me anything!

What would you like to know?`
}

/**
 * Get or create conversation record
 */
async function getOrCreateConversation(
  userId: string,
  customerPhone: string,
  customerName: string
) {
  const supabase = await createServerClient()

  // Try to get existing conversation
  const { data: existing } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('customer_phone', customerPhone)
    .single()

  if (existing) {
    // Update last message time and count
    await supabase
      .from('whatsapp_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        message_count: existing.message_count + 1,
        customer_name: customerName, // Update name in case it changed
      } as any)
      .eq('id', existing.id)

    return existing
  }

  // Create new conversation
  const { data: newConversation, error } = await supabase
    .from('whatsapp_conversations')
    .insert({
      user_id: userId,
      customer_phone: customerPhone,
      customer_name: customerName,
      conversation_state: 'active',
      message_count: 1,
    } as any)
    .select()
    .single()

  if (error) {
    console.error('[Router] Error creating conversation:', error)
    throw error
  }

  return newConversation
}

/**
 * Save message to database
 */
async function saveMessage(data: {
  userId: string
  customerPhone: string
  messageBody: string
  intent: string
  direction: 'inbound' | 'outbound'
}) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: data.userId,
        customer_phone: data.customerPhone,
        message_type: data.intent,
        message_content: data.messageBody,
        direction: data.direction,
        status: 'received',
        intent: data.intent,
        ai_processed: false,
      } as any)

    if (error) {
      console.error('[Router] Error saving message:', error)
    }
  } catch (error) {
    console.error('[Router] Error in saveMessage:', error)
  }
}
