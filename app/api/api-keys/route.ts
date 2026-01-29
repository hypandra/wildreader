import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getServiceClient } from '@/app/api/_utils'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('wr_api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ apiKey: '' })
    }

    return NextResponse.json({ apiKey: data.encrypted_key })
  } catch (error) {
    console.error('[API Keys] GET error:', error)
    return NextResponse.json({ error: 'Failed to load API key' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { apiKey?: string }
    const apiKey = body.apiKey?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'apiKey is required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('wr_api_keys')
      .upsert(
        {
          user_id: user.id,
          encrypted_key: apiKey,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[API Keys] POST error:', error)
    return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('wr_api_keys')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[API Keys] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}
