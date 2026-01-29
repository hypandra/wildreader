import { NextRequest, NextResponse } from 'next/server'
import { getOwnedChild, getSessionUser, getServiceClient } from '@/app/api/_utils'

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

    const body = (await request.json()) as {
      itemType?: 'vocabulary' | 'letter'
      itemId?: string
      gameType?: string
      isCorrect?: boolean
    }

    if (!body.itemType || !body.itemId || !body.gameType || typeof body.isCorrect !== 'boolean') {
      return NextResponse.json(
        { error: 'itemType, itemId, gameType, and isCorrect are required' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()
    const { error } = await supabase.rpc('increment_mastery', {
      p_child_id: child.id,
      p_item_type: body.itemType,
      p_item_id: body.itemId,
      p_game_type: body.gameType,
      p_is_correct: body.isCorrect,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Mastery] POST error:', error)
    return NextResponse.json({ error: 'Failed to update mastery' }, { status: 500 })
  }
}
