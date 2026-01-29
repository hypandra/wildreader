import { NextRequest, NextResponse } from 'next/server'
import { getOwnedChild, getSessionUser, getServiceClient } from '@/app/api/_utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const child = await getOwnedChild(id, user.id)
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase.rpc('get_vocabulary_with_mastery', {
      p_child_id: child.id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    console.error('[Vocabulary] GET error:', error)
    return NextResponse.json({ error: 'Failed to load vocabulary' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const child = await getOwnedChild(id, user.id)
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const body = (await request.json()) as { word?: string; emoji?: string }
    const word = body.word?.trim()
    const emoji = body.emoji?.trim()

    if (!word || !emoji) {
      return NextResponse.json({ error: 'word and emoji are required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('wr_vocabulary_items')
      .insert({ child_id: child.id, word, emoji, is_default: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Vocabulary] POST error:', error)
    return NextResponse.json({ error: 'Failed to add vocabulary word' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const child = await getOwnedChild(id, user.id)
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const body = (await request.json()) as { wordId?: string }
    const wordId = body.wordId?.trim()
    if (!wordId) {
      return NextResponse.json({ error: 'wordId is required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('wr_vocabulary_items')
      .delete()
      .eq('id', wordId)
      .eq('child_id', child.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Vocabulary] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete vocabulary word' }, { status: 500 })
  }
}
