import type { MasteryData, GameType } from "@/types"

export function getCorrectRate(mastery: MasteryData): number {
  if (mastery.attempts === 0) return 0
  return mastery.correct / mastery.attempts
}

export function calculateWeight(mastery: MasteryData): number {
  if (mastery.attempts === 0) return 10
  const correctRate = getCorrectRate(mastery)
  return (1 - correctRate) * 10 + 1
}

const DEFAULT_MASTERY: MasteryData = { attempts: 0, correct: 0 }

export function selectWeightedRandom<T extends { mastery: Record<GameType, MasteryData> }>(
  items: T[],
  gameType: GameType
): T {
  const weights = items.map((item) => ({
    item,
    weight: calculateWeight(item.mastery?.[gameType] ?? DEFAULT_MASTERY),
  }))

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
  let random = Math.random() * totalWeight

  for (const { item, weight } of weights) {
    random -= weight
    if (random <= 0) {
      return item
    }
  }

  return weights[weights.length - 1].item
}

export function updateMastery(
  mastery: MasteryData | undefined,
  isCorrect: boolean
): MasteryData {
  const current = mastery ?? DEFAULT_MASTERY
  return {
    attempts: current.attempts + 1,
    correct: current.correct + (isCorrect ? 1 : 0),
  }
}


