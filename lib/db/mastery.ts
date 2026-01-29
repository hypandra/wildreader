import type { GameType } from '@/types'

export async function updateMastery(
  childId: string,
  itemType: 'vocabulary' | 'letter' | 'person',
  itemId: string,
  gameType: GameType,
  isCorrect: boolean
): Promise<void> {
  const response = await fetch(`/api/children/${childId}/mastery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemType,
      itemId,
      gameType,
      isCorrect,
    }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to update mastery')
  }
}
