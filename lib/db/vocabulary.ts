import type { VocabularyItem, GameType, MasteryData } from '@/types'

export async function getVocabularyWithMastery(
  childId: string
): Promise<VocabularyItem[]> {
  const response = await fetch(`/api/children/${childId}/vocabulary`)
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to load vocabulary')
  }

  const payload = (await response.json()) as { items?: any[] }
  const data = payload.items || []

  // Transform JSONB mastery to typed object with defaults for all game types
  const gameTypes: GameType[] = [
    'letter-match',
    'letter-hunt',
    'letter-to-picture',
    'picture-to-letter',
    'starts-with',
    'ends-with',
    'word-match',
    'picture-match',
  ]

  return (data || []).map((item: any) => {
    const mastery: Record<GameType, MasteryData> = {} as any

    // Ensure all game types have mastery data (default to 0 attempts/correct)
    gameTypes.forEach((gameType) => {
      mastery[gameType] = item.mastery?.[gameType] || { attempts: 0, correct: 0 }
    })

    return {
      id: item.id,
      word: item.word,
      emoji: item.emoji,
      mastery,
    }
  })
}

export async function addVocabularyWord(
  childId: string,
  word: string,
  emoji: string
): Promise<void> {
  const response = await fetch(`/api/children/${childId}/vocabulary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, emoji }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to add vocabulary word')
  }
}

export async function deleteVocabularyWord(
  childId: string,
  wordId: string
): Promise<void> {
  const response = await fetch(`/api/children/${childId}/vocabulary`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wordId }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to delete vocabulary word')
  }
}
