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
    const { data, error } = await supabase
      .from('wr_game_sessions')
      .select('*')
      .eq('child_id', child.id)
      .single()

    if (error || !data) {
      return NextResponse.json({
        session: {
          currentGame: null,
          streak: 0,
          totalStars: 0,
          difficultyByGame: {},
        },
      })
    }

    return NextResponse.json({
      session: {
        currentGame: data.current_game,
        streak: data.streak,
        totalStars: data.total_stars,
        difficultyByGame: data.difficulty_by_game || {},
      },
    })
  } catch (error) {
    console.error('[Session] GET error:', error)
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 })
  }
}

export async function PUT(
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
      currentGame?: string | null
      streak?: number
      totalStars?: number
      difficultyByGame?: Record<string, string>
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('wr_game_sessions')
      .upsert(
        {
          child_id: child.id,
          current_game: body.currentGame !== undefined ? body.currentGame : undefined,
          streak: body.streak !== undefined ? body.streak : undefined,
          total_stars: body.totalStars !== undefined ? body.totalStars : undefined,
          difficulty_by_game: body.difficultyByGame !== undefined ? body.difficultyByGame : undefined,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'child_id',
          ignoreDuplicates: false,
        }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Session] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
