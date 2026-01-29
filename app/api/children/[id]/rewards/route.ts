import { NextRequest, NextResponse } from 'next/server'
import { getOwnedChild, getSessionUser, getServiceClient } from '@/app/api/_utils'
import { deleteImageFromBunny } from '@/lib/bunnycdn'

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
      .from('wr_rewards')
      .select('*')
      .eq('child_id', child.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rewards: data ?? [] })
  } catch (error) {
    console.error('[Rewards] GET error:', error)
    return NextResponse.json({ error: 'Failed to load rewards' }, { status: 500 })
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

    const body = (await request.json()) as {
      transcript?: string
      imageUrl?: string
      words?: string[]
      gameType?: string
      streak?: number
    }

    const transcript = body.transcript?.trim()
    const imageUrl = body.imageUrl?.trim()
    const words = Array.isArray(body.words) ? body.words : []
    const gameType = body.gameType?.trim()
    const streak = typeof body.streak === 'number' ? body.streak : 0

    if (!transcript || !imageUrl || !gameType) {
      return NextResponse.json(
        { error: 'transcript, imageUrl, and gameType are required' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('wr_rewards')
      .insert({
        child_id: child.id,
        transcript,
        image_url: imageUrl,
        words,
        game_type: gameType,
        streak_at_earn: streak,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Rewards] POST error:', error)
    return NextResponse.json({ error: 'Failed to add reward' }, { status: 500 })
  }
}

export async function DELETE(
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

    // First, get all rewards to find image URLs for CDN cleanup
    const { data: rewards, error: fetchError } = await supabase
      .from('wr_rewards')
      .select('image_url')
      .eq('child_id', child.id)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Delete all rewards from database
    const { error } = await supabase
      .from('wr_rewards')
      .delete()
      .eq('child_id', child.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Clean up CDN images (best effort, don't fail request if this errors)
    if (rewards && rewards.length > 0) {
      for (const reward of rewards) {
        if (reward.image_url && reward.image_url.includes('bunnycdn')) {
          try {
            const urlParts = reward.image_url.split('/rewards/')
            if (urlParts.length > 1) {
              const filename = urlParts[1]
              await deleteImageFromBunny(filename)
            }
          } catch (cdnError) {
            console.error('[Rewards] CDN cleanup error:', cdnError)
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Rewards] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to clear rewards' }, { status: 500 })
  }
}
