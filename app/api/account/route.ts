import { NextResponse } from 'next/server'
import { getSessionUser, getServiceClient } from '@/app/api/_utils'
import { deleteImageFromBunny } from '@/lib/bunnycdn'

export async function DELETE() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const userId = user.id

    // 1. Get all child profiles for this user
    const { data: children, error: childError } = await supabase
      .from('wr_child_profiles')
      .select('id')
      .eq('user_id', userId)

    if (childError) {
      console.error('[Account Delete] Error fetching children:', childError)
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
    }

    // 2. For each child, clean up reward images from CDN
    for (const child of children || []) {
      const { data: rewards } = await supabase
        .from('wr_rewards')
        .select('image_url')
        .eq('child_id', child.id)

      // Clean up CDN images
      for (const reward of rewards || []) {
        if (reward.image_url && reward.image_url.includes('bunnycdn')) {
          try {
            const urlParts = reward.image_url.split('/rewards/')
            if (urlParts.length > 1) {
              await deleteImageFromBunny(urlParts[1])
            }
          } catch (cdnError) {
            console.error('[Account Delete] CDN cleanup error:', cdnError)
          }
        }
      }
    }

    // Also clean up face match photos
    const { data: faces } = await supabase
      .from('wr_faces')
      .select('image_path')
      .eq('user_id', userId)

    const facePaths = (faces || [])
      .map((face) => face.image_path)
      .filter((path) => Boolean(path)) as string[]

    if (facePaths.length > 0) {
      await supabase.storage.from('people-photos').remove(facePaths)
    }

    // 3. Delete all child-related data (rewards, mastery, people, etc.)
    // Foreign key cascades should handle most of this, but be explicit
    for (const child of children || []) {
      // Delete rewards
      await supabase.from('wr_rewards').delete().eq('child_id', child.id)
      // Delete mastery data
      await supabase.from('wr_mastery_data').delete().eq('child_id', child.id)
      // Delete todays-sound attempts
      await supabase.from('wr_todays_sound_attempts').delete().eq('child_id', child.id)
      // Delete child-face links
      await supabase.from('wr_child_faces').delete().eq('child_id', child.id)
      // Delete vocabulary
      await supabase.from('wr_vocabulary_items').delete().eq('child_id', child.id)
      // Delete letters
      await supabase.from('wr_letters').delete().eq('child_id', child.id)
    }

    await supabase.from('wr_faces').delete().eq('user_id', userId)

    // 4. Delete child profiles
    const { error: deleteChildrenError } = await supabase
      .from('wr_child_profiles')
      .delete()
      .eq('user_id', userId)

    if (deleteChildrenError) {
      console.error('[Account Delete] Error deleting children:', deleteChildrenError)
    }

    // 5. Delete BetterAuth data (note: BetterAuth uses camelCase column names)
    // Sessions
    await supabase.from('wr_session').delete().eq('userId', userId)
    // Accounts
    await supabase.from('wr_account').delete().eq('userId', userId)
    // Verification tokens (if any)
    await supabase.from('wr_verification').delete().eq('identifier', user.email)

    // 6. Finally, delete the user
    const { error: deleteUserError } = await supabase
      .from('wr_user')
      .delete()
      .eq('id', userId)

    if (deleteUserError) {
      console.error('[Account Delete] Error deleting user:', deleteUserError)
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Account Delete] Error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
