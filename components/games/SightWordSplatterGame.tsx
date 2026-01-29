"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Playfield } from "@/components/games/sight-word-splatter/Playfield"
// Hidden until ready - see NEXT.md
// import { RemixPanel } from "@/components/games/sight-word-splatter/RemixPanel"
import { SightWordSplatterHeader } from "@/components/games/sight-word-splatter/SightWordSplatterHeader"
import { SplatLayers } from "@/components/games/sight-word-splatter/SplatLayers"
import { TargetCard } from "@/components/games/sight-word-splatter/TargetCard"
import { BUTTON_COLORS, type Splat } from "@/components/games/sight-word-splatter/SplatVisuals"
import type { SightWordSplatterOverrides, TargetPosition } from "@/components/games/sight-word-splatter/types"
import { prefetchSpeech, speak, speakSequence } from "@/lib/audio"
import { useAudio } from "@/lib/contexts/AudioContext"
import { chooseSightWordTarget, pickSightWordPool } from "@/lib/sight-word-splatter"
import { getSentenceForWord } from "@/lib/sight-word-sentences"
import type { Difficulty, VocabularyItem } from "@/types"

type GameItemType = "letter" | "vocabulary" | "person"

type SightWordSplatterGameProps = {
  vocabulary: VocabularyItem[]
  initialDifficulty?: Difficulty
  onDifficultyChange?: (level: Difficulty) => void
  onCorrect: (itemId: string, itemType: GameItemType) => void
  onWrong: (itemId: string, itemType: GameItemType) => void
  onComplete: (wasCorrect: boolean, hadMistakes: boolean) => void
  rewardDialogOpen?: boolean
}

type SightWordSplatterQuestion = {
  target: VocabularyItem
  options: VocabularyItem[]
  correctIndex: number
  distractorCount: number
}

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min

export function SightWordSplatterGame({
  vocabulary,
  initialDifficulty,
  onDifficultyChange,
  onCorrect,
  onWrong,
  onComplete,
  rewardDialogOpen,
}: SightWordSplatterGameProps) {
  const { audioEnabled } = useAudio()
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty ?? "easy")
  const [question, setQuestion] = useState<SightWordSplatterQuestion | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [wrongIndex, setWrongIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [hadMistake, setHadMistake] = useState(false)
  const [wordsFound, setWordsFound] = useState(0)
  const [splats, setSplats] = useState<Splat[]>([])
  const [splatMarks, setSplatMarks] = useState<Splat[]>([])
  const [buttonColorsById, setButtonColorsById] = useState<Record<string, number>>({})
  const [targetPositionsById, setTargetPositionsById] = useState<Record<string, TargetPosition>>({})
  const [playfieldHeight, setPlayfieldHeight] = useState<number | undefined>(undefined)
  const [roundIndex, setRoundIndex] = useState(0)
  const [priorTargetWord, setPriorTargetWord] = useState<string | null>(null)
  const [remixOverrides, setRemixOverrides] = useState<SightWordSplatterOverrides>({})
  const [poolId, setPoolId] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const playfieldRef = useRef<HTMLDivElement>(null)
  const vocabularyRef = useRef<VocabularyItem[]>([])
  const positionsByIdRef = useRef<Record<string, TargetPosition>>({})
  const colorsByIdRef = useRef<Record<string, number>>({})
  const poolIdRef = useRef(0)
  const lastSpokenTargetRef = useRef<string | null>(null)
  const lastSpokenAtRef = useRef(0)
  const lastTargetIdRef = useRef<string | null>(null)
  const lastTargetWordRef = useRef<string | null>(null)
  const lastPlayfieldWidthRef = useRef<number | null>(null)

  const instructionText = remixOverrides.audio?.instruction?.trim() || "Click a word to make it splat."
  const selection = remixOverrides.rules?.selection ?? "weighted"
  const buttonPalette = remixOverrides.ui?.buttonColors?.length
    ? remixOverrides.ui.buttonColors
    : BUTTON_COLORS.map((color) => color.hex)
  const splatMin = remixOverrides.ui?.splatScale?.min ?? 160
  const splatMax = remixOverrides.ui?.splatScale?.max ?? 260

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (initialDifficulty && initialDifficulty !== difficulty) {
      setDifficulty(initialDifficulty)
    }
  }, [difficulty, initialDifficulty])

  useEffect(() => {
    if (question && audioEnabled && !rewardDialogOpen) {
      const now = Date.now()
      const sameTarget = lastSpokenTargetRef.current === question.target.id
      const recentlySpoken = now - lastSpokenAtRef.current < 600
      const recentlySameTarget = sameTarget && now - lastSpokenAtRef.current < 1500

      if (recentlySpoken || recentlySameTarget) return

      lastSpokenTargetRef.current = question.target.id
      lastSpokenAtRef.current = now
      // Play: word, sentence using word, word (like a spelling pattern)
      const word = question.target.word
      const sentence = getSentenceForWord(word)
      speakSequence([
        { text: word, category: "words", rate: 0.85 },
        { text: sentence, category: "phrases", rate: 0.95 },
        { text: word, category: "words", rate: 0.85 },
      ])
    }
  }, [audioEnabled, question, rewardDialogOpen])

  useEffect(() => {
    if (!audioEnabled || !question) return

    const sentence = getSentenceForWord(question.target.word)
    prefetchSpeech([
      { text: instructionText, category: "phrases", rate: 0.95 },
      { text: "Sorry, that word is", category: "phrases", rate: 0.95 },
      { text: "Please click", category: "phrases", rate: 0.95 },
      { text: "to make it splat.", category: "phrases", rate: 0.95 },
      { text: question.target.word, category: "words", rate: 0.85 },
      { text: sentence, category: "phrases", rate: 0.95 },
    ])
  }, [audioEnabled, instructionText, question])

  useEffect(() => {
    vocabularyRef.current = vocabulary
  }, [vocabulary])

  const startNewRound = useCallback(() => {
    const currentVocabulary = vocabularyRef.current
    if (!currentVocabulary.length) return

    setSelectedIndex(null)
    setWrongIndex(null)
    setFeedback(null)
    setHadMistake(false)
    setRoundIndex(0)
    setPriorTargetWord(null)
    lastTargetIdRef.current = null
    lastTargetWordRef.current = null

    try {
      const pool = pickSightWordPool(currentVocabulary, difficulty, {
        poolSizes: remixOverrides.rules?.poolSizes,
        selection,
      })

      if (pool.length === 0) {
        throw new Error("No sight words available")
      }

      const { target, correctIndex } = chooseSightWordTarget(pool, selection)

      colorsByIdRef.current = {}
      pool.forEach((item) => {
        colorsByIdRef.current[item.id] = Math.floor(Math.random() * buttonPalette.length)
      })

      setQuestion({
        target,
        options: pool,
        correctIndex,
        distractorCount: Math.max(0, pool.length - 1),
      })
      setButtonColorsById({ ...colorsByIdRef.current })
      setPoolId((prev) => prev + 1)
    } catch (error) {
      console.error("Error generating sight word splatter question:", error)
      timeoutRef.current = setTimeout(() => startNewRound(), 1000)
    }
  }, [buttonPalette.length, difficulty, remixOverrides.rules?.poolSizes, selection])

  useEffect(() => {
    startNewRound()
  }, [difficulty, startNewRound, vocabulary.length])

  useEffect(() => {
    if (!question) return
    if (lastTargetIdRef.current === question.target.id) return

    if (lastTargetWordRef.current) {
      setPriorTargetWord(lastTargetWordRef.current)
    }

    lastTargetIdRef.current = question.target.id
    lastTargetWordRef.current = question.target.word
    setRoundIndex((prev) => prev + 1)
  }, [question])

  const buildTargetPositions = useCallback((options: VocabularyItem[]) => {
    if (!playfieldRef.current) return

    const rect = playfieldRef.current.getBoundingClientRect()
    const isCompact = rect.width < 640
    const padding = 24
    const reservedBottom = 120
    const baseMargin = Math.max(10, Math.min(28, Math.floor(rect.width / 42)))
    const fontSize = isCompact ? 18 : 20
    const lineHeight = isCompact ? 24 : 28
    const paddingX = isCompact ? 12 : 16
    const paddingY = isCompact ? 8 : 10
    const metricsById = options.reduce<Record<string, { width: number; height: number }>>(
      (acc, option) => {
        const rawWidth = option.word.trim().length * fontSize * 0.62 + paddingX * 2
        const width = Math.min(rect.width - padding * 2, Math.max(72, Math.round(rawWidth)))
        const height = Math.max(lineHeight + paddingY * 2, isCompact ? 44 : 52)
        acc[option.id] = { width, height }
        return acc
      },
      {}
    )
    const averageWidth =
      options.reduce((sum, option) => sum + metricsById[option.id].width, 0) /
      Math.max(1, options.length)
    const averageHeight =
      options.reduce((sum, option) => sum + metricsById[option.id].height, 0) /
      Math.max(1, options.length)
    const requiredArea =
      options.length * (averageWidth + baseMargin) * (averageHeight + baseMargin)
    const availableHeight = Math.max(rect.height, requiredArea / rect.width + reservedBottom + padding * 2)
    const fieldHeight = Math.max(rect.height, Math.ceil(availableHeight))
    const maxY = Math.max(padding, fieldHeight - averageHeight - padding - reservedBottom)

    const positionsById: Record<string, TargetPosition> = {}
    const driftRange = isCompact ? 0 : Math.min(68, Math.max(24, Math.floor(baseMargin * 1.6)))
    const maxTries = 120

    let maxPlacedBottom = 0

    options.forEach((option) => {
      const { width, height } = metricsById[option.id]
      const maxX = Math.max(padding, rect.width - width - padding)
      const maxYForWord = Math.max(padding, maxY - height)
      let x = randomRange(padding, maxX)
      let y = randomRange(padding, maxYForWord)
      let marginScale = 1
      let hasOverlap = false

      for (let i = 0; i < maxTries; i += 1) {
        hasOverlap = Object.values(positionsById).some((pos) => {
          const margin = baseMargin * marginScale
          const overlapsX = x < pos.x + pos.width + margin && x + width + margin > pos.x
          const overlapsY = y < pos.y + pos.height + margin && y + height + margin > pos.y
          return overlapsX && overlapsY
        })

        if (!hasOverlap) break

        if (i === Math.floor(maxTries * 0.6)) {
          marginScale = 0.9
        }
        if (i === Math.floor(maxTries * 0.85)) {
          marginScale = 0.8
        }

        x = randomRange(padding, maxX)
        y = randomRange(padding, maxYForWord)
      }

      if (hasOverlap) {
        x = padding
        y = Math.max(padding, maxPlacedBottom + baseMargin)
      }

      const side = Math.floor(randomRange(0, 4))
      let spawnOffsetX = 0
      let spawnOffsetY = 0

      if (side === 0) {
        spawnOffsetX = -(x + width + 60)
        spawnOffsetY = randomRange(-120, 120)
      } else if (side === 1) {
        spawnOffsetX = rect.width - x + 60
        spawnOffsetY = randomRange(-120, 120)
      } else if (side === 2) {
        spawnOffsetY = -(y + height + 60)
        spawnOffsetX = randomRange(-140, 140)
      } else {
        spawnOffsetY = rect.height - y + 60
        spawnOffsetX = randomRange(-140, 140)
      }

      const position: TargetPosition = {
        x,
        y,
        width,
        height,
        driftX: randomRange(-driftRange, driftRange),
        driftY: randomRange(-driftRange, driftRange),
        spawnOffsetX,
        spawnOffsetY,
        duration: randomRange(6, 10),
        delay: randomRange(0, 1.2),
      }

      positionsById[option.id] = position
      maxPlacedBottom = Math.max(maxPlacedBottom, y + height)
    })

    positionsByIdRef.current = positionsById
    setTargetPositionsById({ ...positionsById })
    setPlayfieldHeight(Math.max(fieldHeight, maxPlacedBottom + padding + reservedBottom))
    lastPlayfieldWidthRef.current = rect.width
  }, [])

  useEffect(() => {
    if (!question) return

    if (poolIdRef.current !== poolId) {
      poolIdRef.current = poolId
      const frame = window.requestAnimationFrame(() => buildTargetPositions(question.options))
      return () => window.cancelAnimationFrame(frame)
    }

    setTargetPositionsById({ ...positionsByIdRef.current })
  }, [buildTargetPositions, poolId, question])

  useEffect(() => {
    if (!question) return
    const handleResize = () => {
      if (!playfieldRef.current) return
      const { width } = playfieldRef.current.getBoundingClientRect()
      const lastWidth = lastPlayfieldWidthRef.current
      if (lastWidth && Math.abs(width - lastWidth) < 2) return
      buildTargetPositions(question.options)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [buildTargetPositions, question])

  useEffect(() => {
    if (!question) return
    setButtonColorsById({ ...colorsByIdRef.current })
  }, [question])

  const triggerSplat = (rect: DOMRect, color: string, word: string) => {
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const id = Date.now()
    const length = Math.max(1, word.trim().length)
    const scale = Math.min(1.3, Math.max(0.6, 3 / length))
    const newSplat = {
      id,
      x: centerX,
      y: centerY,
      color,
      size: randomRange(splatMin, splatMax) * scale,
      rotation: randomRange(0, 360),
    }

    // Add flying particles
    setSplats((prev) => [...prev, newSplat])

    // Add permanent splat mark
    setSplatMarks((prev) => [...prev, newSplat])

    // Cleanup flying particles after animation
    setTimeout(() => {
      setSplats((prev) => prev.filter((s) => s.id !== id))
    }, 1500)
  }

  const handleCorrect = (index: number, rect: DOMRect, color: string) => {
    if (!question) return

    setSelectedIndex(index)
    setFeedback("correct")
    setWordsFound((prev) => prev + 1)
    triggerSplat(rect, color, question.target.word)

    if (hadMistake) {
      onWrong(question.target.id, "vocabulary")
    } else {
      onCorrect(question.target.id, "vocabulary")
    }

    timeoutRef.current = setTimeout(() => {
      const remaining = question.options.filter((item) => item.id !== question.target.id)

      if (remaining.length === 0) {
        onComplete(true, hadMistake)
        startNewRound()
        return
      }

      const { target: nextTarget, correctIndex: nextCorrectIndex } = chooseSightWordTarget(remaining, selection)

      setSelectedIndex(null)
      setWrongIndex(null)
      setFeedback(null)
      setHadMistake(false)
      setQuestion({
        target: nextTarget,
        options: remaining,
        correctIndex: nextCorrectIndex,
        distractorCount: Math.max(0, remaining.length - 1),
      })
      onComplete(true, hadMistake)
    }, 1200)
  }

  const handleWrong = (index: number, wrongWord: string) => {
    if (!question) return

    setWrongIndex(index)
    setFeedback("wrong")
    setHadMistake(true)

    if (audioEnabled) {
      speakSequence([
        { text: "Sorry, that word is", category: "phrases", rate: 0.95 },
        { text: wrongWord, category: "words", rate: 0.95 },
        { text: "Please click", category: "phrases", rate: 0.95 },
        { text: question.target.word, category: "words", rate: 0.95 },
        { text: "to make it splat.", category: "phrases", rate: 0.95 },
      ])
    }

    // Just brief red highlight, no fun animation
    timeoutRef.current = setTimeout(() => {
      setFeedback(null)
      setWrongIndex(null)
    }, 500)
  }

  const handleAnswer = (index: number, rect: DOMRect, color: string) => {
    if (!question || feedback === "correct" || feedback === "wrong") return

    const isCorrect = index === question.correctIndex
    if (isCorrect) {
      handleCorrect(index, rect, color)
      return
    }

    handleWrong(index, question.options[index]?.word ?? "that word")
  }

  if (!question) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <p className="text-xl font-display text-bark">Loading splatter...</p>
      </div>
    )
  }

  return (
    <section
      className="relative w-full min-h-[calc(100svh-140px)] overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 pt-0 pb-6 sm:pb-8"
      style={remixOverrides.ui?.background ? { backgroundImage: `linear-gradient(to bottom, ${remixOverrides.ui.background.from}, ${remixOverrides.ui.background.to})` } : undefined}
    >
      <SplatLayers splatMarks={splatMarks} splats={splats} />

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-yellow-200/40 blur-3xl" />
        <div className="absolute top-1/4 -right-10 h-56 w-56 rounded-full bg-pink-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 px-4 sm:px-6">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4 sm:gap-6">
          <SightWordSplatterHeader
            wordsFound={wordsFound}
          />

          <TargetCard
            targetId={question.target.id}
            onSpeakTarget={() => {
              if (audioEnabled) {
                const word = question.target.word
                const sentence = getSentenceForWord(word)
                speakSequence([
                  { text: word, category: "words", rate: 0.85 },
                  { text: sentence, category: "phrases", rate: 0.95 },
                  { text: word, category: "words", rate: 0.85 },
                ])
              }
            }}
            onSpeakDirections={() => {
              if (audioEnabled) {
                speak(instructionText, { rate: 0.95, category: "phrases" })
              }
            }}
            instructionText={instructionText}
          />

          {/* Hidden until ready - see NEXT.md
          <div className="w-full mt-4">
            <RemixPanel
              difficulty={difficulty}
              overrides={remixOverrides}
              onApply={setRemixOverrides}
              onReset={() => setRemixOverrides({})}
            />
          </div>
          */}

        </div>

        {/* Floating word targets */}
        <div ref={playfieldRef} className="w-full">
          <Playfield
            options={question.options}
            positionsById={targetPositionsById}
            buttonColorsById={buttonColorsById}
            colorPalette={buttonPalette}
            height={playfieldHeight}
            feedback={feedback}
            selectedIndex={selectedIndex}
            wrongIndex={wrongIndex}
            onAnswer={handleAnswer}
          />
        </div>
      </div>
    </section>
  )
}
