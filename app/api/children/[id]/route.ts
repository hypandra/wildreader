import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getServiceClient } from '@/app/api/_utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await request.json()) as {
      name?: string
      avatarEmoji?: string
      dateOfBirth?: string
    }

    const updates: Record<string, unknown> = {}
    if (body.name?.trim()) updates.name = body.name.trim()
    if (body.avatarEmoji?.trim()) updates.avatar_emoji = body.avatarEmoji.trim()
    if (body.dateOfBirth) updates.date_of_birth = body.dateOfBirth

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('wr_child_profiles')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    return NextResponse.json({ child: data })
  } catch (error) {
    console.error('[Children] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 })
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
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('wr_child_profiles')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Children] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 })
  }
}
