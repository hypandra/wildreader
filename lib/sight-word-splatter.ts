import type { Difficulty, VocabularyItem } from "@/types"
import type { SightWordSelectionStrategy } from "@/components/games/sight-word-splatter/types"
import { selectWeightedRandom } from "@/lib/mastery"

export const SIGHT_WORD_POOL_SIZES: Record<Difficulty, number> = {
  easy: 10,
  medium: 15,
  hard: 20,
  expert: 30,
}

const shuffle = <T,>(items: T[]) => {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const selectRandom = <T,>(items: T[]) => {
  return items[Math.floor(Math.random() * items.length)]
}

const selectSequential = <T,>(items: T[]) => items[0]

const getSelector = (selection: SightWordSelectionStrategy) => {
  if (selection === "random") return selectRandom
  if (selection === "sequential") return selectSequential
  return <T,>(items: T[]) => selectWeightedRandom(items as any, "sight-word-splatter") as T
}

export function pickSightWordPool(
  vocabulary: VocabularyItem[],
  difficulty: Difficulty,
  overrides?: {
    poolSizes?: Partial<Record<Difficulty, number>>
    selection?: SightWordSelectionStrategy
  },
  selectFn: typeof selectWeightedRandom = selectWeightedRandom,
  shuffleFn: <T>(items: T[]) => T[] = shuffle
): VocabularyItem[] {
  if (!vocabulary.length) return []

  const selection = overrides?.selection ?? "weighted"
  const sizeOverride = overrides?.poolSizes?.[difficulty]
  const targetSize = Math.min(sizeOverride ?? SIGHT_WORD_POOL_SIZES[difficulty], vocabulary.length)
  const available = [...vocabulary]
  const pool: VocabularyItem[] = []
  const selector = selection === "weighted"
    ? (items: VocabularyItem[]) => selectFn(items, "sight-word-splatter")
    : (items: VocabularyItem[]) => getSelector(selection)(items)

  while (pool.length < targetSize && available.length > 0) {
    const candidate = selector(available)
    pool.push(candidate)
    const candidateIndex = available.findIndex((item) => item.id === candidate.id)
    if (candidateIndex >= 0) {
      available.splice(candidateIndex, 1)
    } else {
      break
    }
  }

  if (selection === "sequential") {
    return pool
  }

  return shuffleFn(pool)
}

export function chooseSightWordTarget(
  options: VocabularyItem[],
  selection: SightWordSelectionStrategy = "weighted",
  selectFn: typeof selectWeightedRandom = selectWeightedRandom
): {
  target: VocabularyItem
  correctIndex: number
} {
  if (options.length === 0) {
    throw new Error("No sight word options available")
  }

  const target = selection === "weighted"
    ? selectFn(options, "sight-word-splatter")
    : getSelector(selection)(options)
  const correctIndex = options.findIndex((item) => item.id === target.id)

  if (correctIndex < 0) {
    return { target: options[0], correctIndex: 0 }
  }

  return { target, correctIndex }
}
