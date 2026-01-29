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
      .from('wr_child_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ children: data ?? [] })
  } catch (error) {
    console.error('[Children] GET error:', error)
    return NextResponse.json({ error: 'Failed to load children' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { name?: string; avatarEmoji?: string }
    const name = body.name?.trim()
    const avatarEmoji = body.avatarEmoji?.trim() || '👶'

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('wr_child_profiles')
      .insert({ user_id: user.id, name, avatar_emoji: avatarEmoji })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ child: data })
  } catch (error) {
    console.error('[Children] POST error:', error)
    return NextResponse.json({ error: 'Failed to create child' }, { status: 500 })
  }
}
