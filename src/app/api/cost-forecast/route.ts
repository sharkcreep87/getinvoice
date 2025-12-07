import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an AI cost-forecast assistant for a food & product pricing system.
When the user gives you a product name (for example "Karipap", "Nasi Lemak Ayam", "Iced Latte", etc.), your job is to:
1. Guess the most common recipe or composition for that product in Malaysia.
2. List all typical ingredients/components used to produce EXACTLY ONE SINGLE UNIT of that product (one piece, one cup, one plate, etc.).

   ⚠️ CRITICAL: All quantities MUST be for ONE UNIT only, NOT for batches or multiple units!
   - If making 1 piece of Karipap → quantities for 1 piece
   - If making 1 cup of Iced Latte → quantities for 1 cup
   - If making 1 plate of Nasi Lemak → quantities for 1 plate

3. For each ingredient, estimate:
   - quantity per SINGLE unit (e.g., "50g flour for 1 piece", NOT "500g flour for 10 pieces")
   - unit of measurement (g, ml, pcs, tbsp, etc.)
   - price per unit in Malaysian Ringgit (RM)
   - cost used for ONE SINGLE unit of product
4. Calculate:
   - total ingredient cost per SINGLE unit
   - recommended selling price per SINGLE unit (include a reasonable profit margin, for example 40–60%)
   - profit per SINGLE unit and profit margin (%)

Make reasonable assumptions and clearly show them in an "Assumptions" section.

OUTPUT REQUIREMENTS:
- Currency must be in RM with 2 decimal places.
- If the user language is Malay, answer in Malay. If English, answer in English.
- Always provide:
  * A short description of the product
  * A clear ingredient cost table
  * A pricing summary
  * A final JSON block for system integration

The JSON must follow this structure exactly:
{
  "product_name": "...",
  "serving_unit": "...",
  "ingredients": [
    {
      "name": "...",
      "quantity": number,
      "unit": "...",
      "unit_price_rm": number,
      "cost_per_unit_rm": number
    }
  ],
  "total_cost_per_unit_rm": number,
  "suggested_selling_price_rm": number,
  "profit_per_unit_rm": number,
  "profit_margin_percent": number,
  "assumptions": [
    "..."
  ]
}

Do NOT add any extra fields in the JSON.
If the product is too generic or ambiguous, ask the user 1–2 short clarification questions before calculating.`

export async function POST(request: NextRequest) {
  try {
    const { productName, conversationHistory = [], customPrompt } = await request.json()

    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-proj-placeholder') {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your OpenAI API key to .env.local' },
        { status: 500 }
      )
    }

    // Use custom prompt if provided, otherwise use default
    const systemPrompt = customPrompt && customPrompt.trim() !== '' ? customPrompt : SYSTEM_PROMPT

    // Build messages array with conversation history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: productName }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    })

    let rawResponse = completion.choices[0]?.message?.content || ''

    // Try to extract JSON from the response
    let jsonData = null
    let cleanResponse = rawResponse

    // Try multiple extraction methods
    let jsonString = null

    // Method 1: Try to find ```json code block
    const codeBlockMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1]
      cleanResponse = rawResponse.replace(/```json\s*[\s\S]*?\s*```/, '').trim()
    }

    // Method 2: Try to find JSON object with product_name
    if (!jsonString) {
      const jsonObjectMatch = rawResponse.match(/\{[\s\S]*?"product_name"[\s\S]*?\}(?=\s*$|[\s\S]*?(?=\n\n))/m)
      if (jsonObjectMatch) {
        jsonString = jsonObjectMatch[0]
        cleanResponse = rawResponse.replace(jsonObjectMatch[0], '').trim()
      }
    }

    // Method 3: Find last complete JSON object in response
    if (!jsonString) {
      const lastBrace = rawResponse.lastIndexOf('}')
      if (lastBrace !== -1) {
        for (let i = 0; i <= lastBrace; i++) {
          if (rawResponse[i] === '{') {
            const potentialJson = rawResponse.substring(i, lastBrace + 1)
            try {
              const parsed = JSON.parse(potentialJson)
              if (parsed.product_name) {
                jsonString = potentialJson
                cleanResponse = rawResponse.substring(0, i) + rawResponse.substring(lastBrace + 1)
                cleanResponse = cleanResponse.trim()
                break
              }
            } catch (e) {
              // Continue searching
            }
          }
        }
      }
    }

    // Parse the extracted JSON
    if (jsonString) {
      try {
        jsonData = JSON.parse(jsonString)
        console.log('Successfully extracted JSON:', jsonData)
      } catch (e) {
        console.error('Failed to parse extracted JSON:', e)
        console.error('JSON string was:', jsonString)
      }
    } else {
      console.warn('Could not find JSON in AI response')
      console.log('Full response:', rawResponse)
    }

    return NextResponse.json({
      success: true,
      response: cleanResponse,
      jsonData,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: productName },
        { role: 'assistant', content: cleanResponse }
      ]
    })
  } catch (error: any) {
    console.error('Cost forecast error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate cost forecast',
        details: error.response?.data || error.toString()
      },
      { status: 500 }
    )
  }
}
