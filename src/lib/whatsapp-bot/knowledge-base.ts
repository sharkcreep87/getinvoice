/**
 * Knowledge Base Helper
 *
 * Retrieves relevant information from knowledge base for AI context
 */

import { createServerClient } from '@/lib/supabase/server'

export interface KnowledgeBaseEntry {
  id: string
  entry_type: 'product' | 'faq' | 'company_info' | 'policy'
  question?: string
  answer?: string
  content?: string
  product_id?: string
  keywords?: string[]
  priority: number
}

/**
 * Get knowledge base entries relevant to the message
 */
export async function getKnowledgeBaseContext(
  userId: string,
  keywords: string[]
): Promise<KnowledgeBaseEntry[]> {
  if (keywords.length === 0) {
    return []
  }

  try {
    const supabase = await createServerClient()

    // Search for entries matching keywords
    const { data, error } = await supabase
      .from('whatsapp_knowledge_base')
      .select('*')
      .eq('user_id', userId)
      .or(
        keywords
          .map(keyword => `keywords.cs.{${keyword}}`)
          .join(',')
      )
      .order('priority', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[KB] Error fetching knowledge base:', error)
      return []
    }

    return (data || []) as KnowledgeBaseEntry[]
  } catch (error) {
    console.error('[KB] Error in getKnowledgeBaseContext:', error)
    return []
  }
}

/**
 * Get all products from knowledge base
 */
export async function getAllProducts(userId: string): Promise<KnowledgeBaseEntry[]> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('whatsapp_knowledge_base')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_type', 'product')
      .order('priority', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[KB] Error fetching products:', error)
      return []
    }

    return (data || []) as KnowledgeBaseEntry[]
  } catch (error) {
    console.error('[KB] Error in getAllProducts:', error)
    return []
  }
}

/**
 * Format knowledge base entries for AI context
 */
export function formatKnowledgeBaseForAI(entries: KnowledgeBaseEntry[]): string {
  if (entries.length === 0) {
    return 'No specific product or company information available.'
  }

  const formatted = entries.map(entry => {
    if (entry.entry_type === 'product') {
      return `Product: ${entry.content || entry.answer || 'No details'}`
    } else if (entry.entry_type === 'faq') {
      return `FAQ - Q: ${entry.question}\nA: ${entry.answer}`
    } else {
      return `${entry.entry_type}: ${entry.content || entry.answer}`
    }
  }).join('\n\n')

  return formatted
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
  userId: string,
  customerPhone: string,
  limit: number = 10
): Promise<Array<{ role: 'user' | 'assistant', content: string }>> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('message_content, direction')
      .eq('user_id', userId)
      .eq('customer_phone', customerPhone)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[KB] Error fetching conversation history:', error)
      return []
    }

    // Reverse to get chronological order
    const messages = (data || []).reverse()

    return messages.map(msg => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.message_content,
    }))
  } catch (error) {
    console.error('[KB] Error in getConversationHistory:', error)
    return []
  }
}
