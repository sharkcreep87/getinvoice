/**
 * AI Handler
 *
 * Processes messages using OpenAI to generate intelligent responses
 * Integrates with knowledge base for context-aware replies
 */

import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase/server'
import {
  getKnowledgeBaseContext,
  getConversationHistory,
  formatKnowledgeBaseForAI,
} from './knowledge-base'
import { extractKeywords } from './intent-detector'

export interface AIQueryContext {
  userId: string
  conversationId: string
  customerPhone: string
  messageBody: string
}

/**
 * Handle AI query and generate response
 */
export async function handleAIQuery(context: AIQueryContext): Promise<string> {
  try {
    const { userId, conversationId, customerPhone, messageBody } = context

    console.log(`[AI] Processing query from ${customerPhone}: "${messageBody}"`)

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[AI] OpenAI API key not configured')
      return "I'm sorry, but the AI service is not configured. Please contact support."
    }

    // Check AI usage limits (basic check)
    const canUseAI = await checkAIUsageLimits(userId)
    if (!canUseAI) {
      return "You've reached your AI message limit for this month. Please upgrade your plan to continue using AI features."
    }

    // Extract keywords for knowledge base search
    const keywords = extractKeywords(messageBody)
    console.log(`[AI] Extracted keywords:`, keywords)

    // Fetch knowledge base context
    const kbEntries = await getKnowledgeBaseContext(userId, keywords)
    console.log(`[AI] Found ${kbEntries.length} knowledge base entries`)

    // Fetch conversation history
    const history = await getConversationHistory(userId, customerPhone, 10)
    console.log(`[AI] Conversation history: ${history.length} messages`)

    // Build OpenAI prompt
    const systemPrompt = buildSystemPrompt(kbEntries)
    const messages = buildMessages(systemPrompt, history, messageBody)

    // Call OpenAI API
    console.log('[AI] Calling OpenAI API...')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    })

    const aiResponse = response.choices[0]?.message?.content || "I'm not sure how to respond to that."
    console.log(`[AI] Generated response: "${aiResponse.substring(0, 100)}..."`)

    // Track AI usage
    await trackAIUsage(userId, conversationId)

    // Mark message as AI processed
    await markMessageAsProcessed(userId, customerPhone)

    return aiResponse
  } catch (error: any) {
    console.error('[AI] Error in handleAIQuery:', error)

    // Handle specific errors
    if (error?.status === 429) {
      return "I'm experiencing high demand right now. Please try again in a moment."
    }

    if (error?.status === 401) {
      return "AI service authentication failed. Please contact support."
    }

    return "I apologize, but I'm having trouble processing your message right now. Please try again or contact support."
  }
}

/**
 * Build system prompt with knowledge base context
 */
function buildSystemPrompt(kbEntries: any[]): string {
  const kbContext = formatKnowledgeBaseForAI(kbEntries)

  return `You are a helpful WhatsApp business assistant. Your role is to help customers with product inquiries, provide information, and assist with bookings and purchases.

IMPORTANT GUIDELINES:
1. Be friendly, professional, and concise
2. Use information from the knowledge base below when available
3. If you don't know something, be honest and offer to connect them with a human
4. Keep responses short (2-3 sentences max for WhatsApp)
5. Use emojis sparingly to add warmth
6. If customer wants to buy, guide them to make an appointment or request a payment link
7. Be helpful but don't make up information not in the knowledge base

KNOWLEDGE BASE:
${kbContext}

Remember: You're representing a real business. Be accurate and helpful!`
}

/**
 * Build message array for OpenAI
 */
function buildMessages(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant', content: string }>,
  currentMessage: string
): Array<{ role: string, content: string }> {
  const messages: Array<{ role: string, content: string }> = [
    { role: 'system', content: systemPrompt }
  ]

  // Add conversation history (limit to last 5 exchanges = 10 messages)
  const recentHistory = history.slice(-10)
  messages.push(...recentHistory)

  // Add current message
  messages.push({ role: 'user', content: currentMessage })

  return messages
}

/**
 * Check AI usage limits
 */
async function checkAIUsageLimits(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient()

    // Get user's subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single() as { data: { subscription_tier: string } | null; error: any }

    if (!profile) {
      return false
    }

    // Free tier: 50 AI messages/month
    // Basic tier: 500 AI messages/month
    // Pro tier: Unlimited
    const limits: Record<string, number> = {
      free: 50,
      basic: 500,
      pro: Infinity,
    }

    const limit = limits[profile.subscription_tier] || 50

    if (limit === Infinity) {
      return true
    }

    // Count AI messages this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('ai_processed', true)
      .gte('created_at', startOfMonth.toISOString())

    const usage = count || 0
    console.log(`[AI] Usage: ${usage}/${limit} (${profile.subscription_tier} tier)`)

    return usage < limit
  } catch (error) {
    console.error('[AI] Error checking usage limits:', error)
    // Allow on error (fail open)
    return true
  }
}

/**
 * Track AI usage
 */
async function trackAIUsage(userId: string, conversationId: string): Promise<void> {
  try {
    const supabase = await createServerClient()

    // Update conversation with AI usage
    await supabase
      .from('whatsapp_conversations')
      .update({
        last_message_at: new Date().toISOString(),
      } as any)
      .eq('id', conversationId)

    console.log('[AI] Tracked AI usage')
  } catch (error) {
    console.error('[AI] Error tracking usage:', error)
  }
}

/**
 * Mark message as AI processed
 */
async function markMessageAsProcessed(userId: string, customerPhone: string): Promise<void> {
  try {
    const supabase = await createServerClient()

    // Get the most recent inbound message that hasn't been processed
    const { data: message } = await supabase
      .from('whatsapp_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('customer_phone', customerPhone)
      .eq('direction', 'inbound')
      .eq('ai_processed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (message) {
      await supabase
        .from('whatsapp_messages')
        .update({ ai_processed: true } as any)
        .eq('id', message.id)
    }
  } catch (error) {
    console.error('[AI] Error marking message as processed:', error)
  }
}
