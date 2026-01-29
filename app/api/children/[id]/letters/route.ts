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
    const { data, error } = await supabase.rpc('get_letters_with_mastery', {
      p_child_id: child.id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    console.error('[Letters] GET error:', error)
    return NextResponse.json({ error: 'Failed to load letters' }, { status: 500 })
  }
}
