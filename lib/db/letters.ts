import type { Letter, GameType, MasteryData } from '@/types'

export async function getLettersWithMastery(
  childId: string
): Promise<Letter[]> {
  const response = await fetch(`/api/children/${childId}/letters`)
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to load letters')
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
      letter: item.letter,
      lowercase: item.lowercase,
      exampleWord: item.example_word,
      exampleEmoji: item.example_emoji,
      mastery,
    }
  })
}
