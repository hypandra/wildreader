import { NextRequest, NextResponse } from 'next/server'
import { getOwnedChild, getSessionUser, getServiceClient } from '@/app/api/_utils'
import { deleteImageFromBunny } from '@/lib/bunnycdn'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; rewardId: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, rewardId } = await params
    const child = await getOwnedChild(id, user.id)
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const supabase = getServiceClient()

    // First, get the reward to find the image URL
    const { data: reward, error: fetchError } = await supabase
      .from('wr_rewards')
      .select('image_url')
      .eq('id', rewardId)
      .eq('child_id', child.id)
      .single()

    if (fetchError || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('wr_rewards')
      .delete()
      .eq('id', rewardId)
      .eq('child_id', child.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Clean up CDN image if it's a BunnyCDN URL
    if (reward.image_url && reward.image_url.includes('bunnycdn')) {
      try {
        // Extract filename from URL (e.g., https://hostname/rewards/filename.png)
        const urlParts = reward.image_url.split('/rewards/')
        if (urlParts.length > 1) {
          const filename = urlParts[1]
          await deleteImageFromBunny(filename)
        }
      } catch (cdnError) {
        // Log but don't fail the request - DB record is already deleted
        console.error('[Rewards] CDN cleanup error:', cdnError)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Rewards] DELETE single error:', error)
    return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 })
  }
}
