import type { RewardInstance, GameType } from '@/types'

export async function getRewards(childId: string): Promise<RewardInstance[]> {
  const response = await fetch(`/api/children/${childId}/rewards`)
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to load rewards')
  }

  const payload = (await response.json()) as { rewards?: any[] }
  const rewards = payload.rewards || []

  return rewards.map(r => ({
    id: r.id,
    date: new Date(r.created_at).toLocaleDateString(),
    time: new Date(r.created_at).toLocaleTimeString(),
    transcript: r.transcript,
    words: r.words || [],
    imageUrl: r.image_url || '',
    gameContext: {
      game: r.game_type,
      streak: r.streak_at_earn
    }
  }))
}

export async function addReward(
  childId: string,
  reward: {
    transcript: string
    imageUrl: string
    words: string[]
    gameType: GameType
    streak: number
  }
): Promise<void> {
  const response = await fetch(`/api/children/${childId}/rewards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: reward.transcript,
      imageUrl: reward.imageUrl,
      words: reward.words,
      gameType: reward.gameType,
      streak: reward.streak,
    }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to add reward')
  }
}

export async function clearRewards(childId: string): Promise<void> {
  const response = await fetch(`/api/children/${childId}/rewards`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to clear rewards')
  }
}

export async function deleteReward(childId: string, rewardId: string): Promise<void> {
  const response = await fetch(`/api/children/${childId}/rewards/${rewardId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to delete reward')
  }
}
