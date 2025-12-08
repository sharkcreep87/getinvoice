import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an AI assistant that extracts expense information from receipt images.
Analyze the receipt and extract:
1. Vendor/merchant name
2. Total amount (numeric value only, no currency symbols)
3. Date (in ISO 8601 format: YYYY-MM-DD)
4. Brief description of purchase
5. Suggested expense category from: Travel, Office Supplies, Utilities, Meals & Entertainment, Equipment, Software & Subscriptions, Marketing & Advertising, Other

Return data in this exact JSON format:
{
  "vendor": "string",
  "amount": number,
  "date": "YYYY-MM-DD",
  "description": "string",
  "suggested_category": "string"
}

If you cannot extract certain fields, use reasonable defaults:
- vendor: "Unknown Vendor"
- amount: 0
- date: today's date
- description: "Expense from receipt"
- suggested_category: "Other"

Be accurate and conservative in your extraction. If unsure, use the defaults.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-proj-placeholder') {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your OpenAI API key to .env.local' },
        { status: 500 }
      )
    }

    // Check AI usage limit
    const { data: adminSettings } = await (supabase as any)
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'daily_ai_request_limit')
      .single()

    const dailyLimit = adminSettings?.setting_value
      ? parseInt(adminSettings.setting_value)
      : 5

    // Check current usage
    const { data: currentUsage } = await (supabase as any)
      .rpc('get_total_today_ai_usage', { p_user_id: user.id })

    if (currentUsage >= dailyLimit) {
      return NextResponse.json(
        {
          error: 'Daily AI request limit reached',
          message: `You have reached your daily limit of ${dailyLimit} AI requests. Please try again tomorrow or contact support to increase your limit.`,
          limit: dailyLimit,
          used: currentUsage
        },
        { status: 429 }
      )
    }

    // Increment usage count
    await (supabase as any)
      .rpc('increment_ai_usage', {
        p_user_id: user.id,
        p_request_type: 'receipt_scan'
      })

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/jpg']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, HEIC' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `receipt_${timestamp}.${fileExt}`
    const filePath = `${user.id}/temp/${fileName}`

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath)

    // Convert image to base64 for Vision API
    const buffer = Buffer.from(fileBuffer)
    const base64Image = buffer.toString('base64')
    const imageData = `data:${file.type};base64,${base64Image}`

    // Call OpenAI Vision API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4 with vision
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract expense information from this receipt image.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageData,
                detail: 'high'
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    })

    const responseText = completion.choices[0]?.message?.content || ''

    // Extract JSON from response
    let extractedData
    try {
      // Try to parse JSON from code block or raw response
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       responseText.match(/\{[\s\S]*?\}/)

      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0]
        extractedData = JSON.parse(jsonString)
      } else {
        throw new Error('No JSON found in response')
      }

      // Validate and set defaults
      extractedData = {
        vendor: extractedData.vendor || 'Unknown Vendor',
        amount: parseFloat(extractedData.amount) || 0,
        date: extractedData.date || new Date().toISOString().split('T')[0],
        description: extractedData.description || 'Expense from receipt',
        suggested_category: extractedData.suggested_category || 'Other'
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.log('Raw response:', responseText)

      // Return default values
      extractedData = {
        vendor: 'Unknown Vendor',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: 'Expense from receipt - AI extraction failed, please review',
        suggested_category: 'Other'
      }
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      receipt_url: publicUrl
    })

  } catch (error: any) {
    console.error('Receipt scan error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to scan receipt',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
