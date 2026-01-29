import { describe, expect, it } from "vitest"
import type { GameType, MasteryData, VocabularyItem } from "@/types"
import { chooseSightWordTarget, pickSightWordPool } from "@/lib/sight-word-splatter"

const GAME_TYPES: GameType[] = [
  "letter-match",
  "letter-hunt",
  "letter-to-picture",
  "picture-to-letter",
  "starts-with",
  "ends-with",
  "word-match",
  "picture-match",
  "face-match",
  "name-to-face",
  "todays-sound",
  "sight-word-splatter",
]

const makeMastery = (): Record<GameType, MasteryData> =>
  GAME_TYPES.reduce(
    (acc, gameType) => {
      acc[gameType] = { attempts: 0, correct: 0 }
      return acc
    },
    {} as Record<GameType, MasteryData>
  )

const makeVocabulary = (count: number): VocabularyItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `word-${index + 1}`,
    word: `word${index + 1}`,
    emoji: "⭐",
    mastery: makeMastery(),
  }))

const selectFirst = (items: VocabularyItem[]) => items[0]
const noShuffle = <T,>(items: T[]) => items

describe("sight word splatter pool", () => {
  it("uses fixed pool sizes per difficulty", () => {
    const vocab = makeVocabulary(40)
    expect(pickSightWordPool(vocab, "easy", undefined, selectFirst as never, noShuffle)).toHaveLength(10)
    expect(pickSightWordPool(vocab, "medium", undefined, selectFirst as never, noShuffle)).toHaveLength(15)
    expect(pickSightWordPool(vocab, "hard", undefined, selectFirst as never, noShuffle)).toHaveLength(20)
    expect(pickSightWordPool(vocab, "expert", undefined, selectFirst as never, noShuffle)).toHaveLength(30)
  })

  it("never returns duplicate ids in the pool", () => {
    const vocab = makeVocabulary(20)
    const pool = pickSightWordPool(vocab, "hard", undefined, selectFirst as never, noShuffle)
    const ids = pool.map((item) => item.id)
    expect(new Set(ids).size).toBe(pool.length)
  })
})

describe("sight word target selection", () => {
  it("always selects a target within the pool", () => {
    const vocab = makeVocabulary(12)
    const pool = pickSightWordPool(vocab, "easy", undefined, selectFirst as never, noShuffle)
    const { target, correctIndex } = chooseSightWordTarget(pool, "weighted", selectFirst as never)
    expect(pool.find((item) => item.id === target.id)).toBeTruthy()
    expect(correctIndex).toBeGreaterThanOrEqual(0)
  })

  it("keeps the next target inside remaining options after removal", () => {
    const vocab = makeVocabulary(12)
    const pool = pickSightWordPool(vocab, "easy", undefined, selectFirst as never, noShuffle)
    const { target } = chooseSightWordTarget(pool, "weighted", selectFirst as never)
    const remaining = pool.filter((item) => item.id !== target.id)
    const next = chooseSightWordTarget(remaining, "weighted", selectFirst as never)
    expect(remaining.find((item) => item.id === next.target.id)).toBeTruthy()
  })
})
