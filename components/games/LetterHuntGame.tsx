"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AudioButton } from "@/components/AudioButton"
import { AnswerFeedback } from "@/components/games/AnswerFeedback"
import { DifficultySelector } from "@/components/games/DifficultySelector"
import { getGameInstruction, speakGameInstruction } from "@/lib/audio"
import { useAudio } from "@/lib/contexts/AudioContext"
import { generateLetterHuntQuestion } from "@/lib/games"
import { cn } from "@/lib/utils"
import type { Difficulty, Letter, VocabularyItem } from "@/types"

type GameItemType = "letter" | "vocabulary" | "person"

type LetterHuntGameProps = {
  vocabulary: VocabularyItem[]
  letters: Letter[]
  initialDifficulty?: Difficulty
  onDifficultyChange?: (level: Difficulty) => void
  onCorrect: (itemId: string, itemType: GameItemType) => void
  onWrong: (itemId: string, itemType: GameItemType) => void
  onComplete: (wasCorrect: boolean, hadMistakes: boolean) => void
  rewardDialogOpen?: boolean
}

type LetterHuntQuestion = ReturnType<typeof generateLetterHuntQuestion>

export function LetterHuntGame({
  letters,
  initialDifficulty,
  onDifficultyChange,
  onCorrect,
  onWrong,
  onComplete,
  rewardDialogOpen,
}: LetterHuntGameProps) {
  const { audioEnabled } = useAudio()
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty ?? "easy")
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [wrongIndices, setWrongIndices] = useState<number[]>([])
  const [foundCount, setFoundCount] = useState(0)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [question, setQuestion] = useState<LetterHuntQuestion | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeouts on unmount
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

  // Auto-play audio instruction when question changes
  useEffect(() => {
    if (question && audioEnabled && !rewardDialogOpen) {
      speakGameInstruction("letter-hunt", question.target.lowercase)
    }
  }, [question, audioEnabled, rewardDialogOpen])

  const generateQuestion = useCallback(() => {
    if (!letters.length) return

    setSelectedIndices([])
    setWrongIndices([])
    setFoundCount(0)
    setFeedback(null)

    try {
      setQuestion(generateLetterHuntQuestion(difficulty))
    } catch (error) {
      console.error("Error generating letter hunt question:", error)
      timeoutRef.current = setTimeout(() => generateQuestion(), 1000)
    }
  }, [difficulty, letters.length])

  useEffect(() => {
    generateQuestion()
  }, [generateQuestion])

  const handleAnswer = (index: number) => {
    if (!question || feedback) return

    const isTarget = question.letters[index] === question.target.letter

    if (isTarget) {
      if (selectedIndices.includes(index)) return

      const newSelected = [...selectedIndices, index]
      setSelectedIndices(newSelected)
      setFoundCount(newSelected.length)

      if (newSelected.length === question.targetCount) {
        setFeedback("correct")

        const hadMistakes = wrongIndices.length > 0
        if (hadMistakes) {
          onWrong(question.target.id, "letter")
        } else {
          onCorrect(question.target.id, "letter")
        }

        timeoutRef.current = setTimeout(() => {
          onComplete(true, hadMistakes)
          generateQuestion()
        }, 1500)
      }
      return
    }

    if (!wrongIndices.includes(index)) {
      setWrongIndices([...wrongIndices, index])
    }
  }

  if (!question) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <p className="text-xl font-display text-bark">Loading letter hunt...</p>
      </div>
    )
  }

  return (
    <div>
      <DifficultySelector
        levels={["easy", "medium", "hard", "expert"] as Difficulty[]}
        current={difficulty}
        onChange={(level) => {
          setDifficulty(level)
          onDifficultyChange?.(level)
        }}
        colorScheme="sunshine"
      />

      <div className="text-center mb-4 animate-pop-in">
        <div className="inline-flex flex-col items-center gap-1">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-soft-lg border-2 border-sunshine/20">
            <div className="text-5xl md:text-6xl">
              {question.target.lowercase}
            </div>
          </div>
          <AudioButton
            text={getGameInstruction("letter-hunt", question.target.lowercase)}
            size="sm"
            variant="ghost"
            className="opacity-60 hover:opacity-100"
          />
        </div>

        <p className="text-base text-muted-foreground font-medium mt-2">
          Tap all the <span className="font-display text-coral">{question.target.lowercase}</span> letters!
          <span className="ml-2 bg-sage/20 text-sage px-2 py-0.5 rounded-full font-semibold text-sm">
            {foundCount}/{question.targetCount}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3 md:gap-4 animate-slide-up">
        {question.letters.map((letter: string, index: number) => {
          const isSelected = selectedIndices.includes(index)
          const isWrong = wrongIndices.includes(index)

          return (
            <button
              key={`${letter}-${index}`}
              onClick={() => handleAnswer(index)}
              disabled={feedback !== null}
              className={cn(
                "relative aspect-square rounded-xl text-3xl md:text-4xl font-display",
                "transition-all duration-200 transform",
                "border-2 shadow-soft",
                feedback !== null && "cursor-not-allowed",
                isWrong
                  ? "bg-gradient-to-br from-destructive to-red-600 text-white border-destructive"
                  : isSelected
                  ? feedback === "correct"
                    ? "bg-gradient-to-br from-sage to-emerald-500 text-white border-sage scale-105 shadow-lg"
                    : "bg-gradient-to-br from-blue-500 to-blue-700 text-white border-blue-600 scale-105 shadow-md"
                  : "bg-card text-bark hover:bg-sunshine/10 border-border hover:border-sunshine hover:scale-105 active:scale-95"
              )}
            >
              {letter.toLowerCase()}
              <div
                className="absolute bottom-1 right-1"
                onClick={(e) => e.stopPropagation()}
              >
                <AudioButton
                  text={letter.toLowerCase()}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 opacity-40 hover:opacity-100"
                />
              </div>
            </button>
          )
        })}
      </div>

      <AnswerFeedback
        feedback={feedback}
        gameType="letter-hunt"
        hintContext={{ target: question.target.lowercase }}
      />
    </div>
  )
}
