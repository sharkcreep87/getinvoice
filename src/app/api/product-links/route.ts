import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

// GET - List all links for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('product_links')
      .select(`
        id,
        product_id,
        token,
        link_type,
        is_active,
        view_count,
        order_count,
        created_at,
        products (
          id,
          name,
          unit_price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Get links error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch links' },
      { status: 500 }
    )
  }
}

// POST - Create a new shareable link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { product_id, link_type } = await request.json()

    // Validate input
    if (!link_type || !['product', 'catalog'].includes(link_type)) {
      return NextResponse.json(
        { error: 'Invalid link type. Must be "product" or "catalog"' },
        { status: 400 }
      )
    }

    if (link_type === 'product' && !product_id) {
      return NextResponse.json(
        { error: 'Product ID required for product links' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = nanoid(10) // 10 character unique ID

    // Create link
    const linkData: any = {
      user_id: user.id,
      token,
      link_type,
      is_active: true,
    }

    if (link_type === 'product') {
      linkData.product_id = product_id
    }

    const { data, error } = await (supabase as any)
      .from('product_links')
      .insert(linkData)
      .select()
      .single()

    if (error) throw error

    // Generate full URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000'
    const fullUrl = `${baseUrl}/order/${token}`

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        full_url: fullUrl,
      }
    })
  } catch (error: any) {
    console.error('Create link error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create link' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a link
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('id')

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('product_links')
      .delete()
      .eq('id', linkId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete link error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete link' },
      { status: 500 }
    )
  }
}

// PATCH - Toggle link active status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { link_id, is_active } = await request.json()

    if (!link_id) {
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
    }

    const { data, error } = await (supabase as any)
      .from('product_links')
      .update({ is_active })
      .eq('id', link_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Update link error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update link' },
      { status: 500 }
    )
  }
}
