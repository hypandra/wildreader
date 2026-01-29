"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AudioButton } from "@/components/AudioButton"
import { AnswerFeedback } from "@/components/games/AnswerFeedback"
import { getGameInstruction, speakGameInstruction, speakHint } from "@/lib/audio"
import { useAudio } from "@/lib/contexts/AudioContext"
import { generateLetterMatchQuestion } from "@/lib/games"
import { cn } from "@/lib/utils"
import type { Letter } from "@/types"

type GameItemType = "letter" | "vocabulary" | "person"

type LetterMatchGameProps = {
  letters: Letter[]
  onCorrect: (itemId: string, itemType: GameItemType) => void
  onWrong: (itemId: string, itemType: GameItemType) => void
  onComplete: (wasCorrect: boolean, hadMistakes: boolean) => void
  rewardDialogOpen?: boolean
}

type LetterMatchQuestion = ReturnType<typeof generateLetterMatchQuestion>

export function LetterMatchGame({
  letters,
  onCorrect,
  onComplete,
  rewardDialogOpen,
}: LetterMatchGameProps) {
  const { audioEnabled } = useAudio()
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [wrongIndices, setWrongIndices] = useState<number[]>([])
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [question, setQuestion] = useState<LetterMatchQuestion | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Auto-play audio instruction when question changes
  useEffect(() => {
    if (question && audioEnabled && !rewardDialogOpen) {
      speakGameInstruction("letter-match", question.target.letter)
    }
  }, [question, audioEnabled, rewardDialogOpen])

  const generateQuestion = useCallback(() => {
    if (!letters.length) return

    setSelectedIndices([])
    setWrongIndices([])
    setFeedback(null)

    try {
      setQuestion(generateLetterMatchQuestion())
    } catch (error) {
      console.error("Error generating letter match question:", error)
      timeoutRef.current = setTimeout(() => generateQuestion(), 1000)
    }
  }, [letters.length])

  useEffect(() => {
    generateQuestion()
  }, [generateQuestion])

  const handleAnswer = (index: number) => {
    if (!question || feedback) return

    const isCorrect = index === question.correctIndex

    if (isCorrect) {
      setSelectedIndices([index])
      setFeedback("correct")

      const hadMistakes = wrongIndices.length > 0
      if (!hadMistakes) {
        onCorrect(question.target.id, "letter")
      }

      timeoutRef.current = setTimeout(() => {
        onComplete(true, hadMistakes)
        generateQuestion()
      }, 1500)
      return
    }

    if (!wrongIndices.includes(index)) {
      setWrongIndices([...wrongIndices, index])
      // Speak hint for wrong answer
      if (audioEnabled) {
        speakHint("letter-match", { target: question.target.letter })
      }
    }
  }

  if (!question) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <p className="text-xl font-display text-bark">Loading letter match...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-4 animate-pop-in">
        <div className="inline-flex flex-col items-center gap-1">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-soft-lg border-2 border-sunshine/20">
            <div className="text-5xl md:text-6xl">
              {question.target.letter}
            </div>
          </div>
          <AudioButton
            text={getGameInstruction("letter-match", question.target.letter)}
            size="sm"
            variant="ghost"
            className="opacity-60 hover:opacity-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 animate-slide-up">
        {question.options.map((option: string, index: number) => {
          const isSelected = selectedIndices.includes(index)
          const isCorrect = index === question.correctIndex
          const isWrong = wrongIndices.includes(index)

          return (
            <button
              key={`${option}-${index}`}
              onClick={() => !feedback && !isWrong && handleAnswer(index)}
              disabled={feedback !== null || isWrong}
              className={cn(
                "relative min-h-[100px] md:min-h-[120px] rounded-2xl p-4",
                "flex items-center justify-center",
                "text-3xl md:text-4xl font-display",
                "transition-all duration-300 transform",
                "border-3 shadow-soft",
                feedback !== null && "cursor-not-allowed",
                isWrong
                  ? "bg-gradient-to-br from-destructive to-red-600 text-white border-destructive opacity-60"
                  : feedback === "correct" && isSelected && isCorrect
                  ? "bg-gradient-to-br from-sage to-emerald-500 text-white border-sage scale-105 shadow-glow animate-celebrate"
                  : "bg-card hover:bg-gradient-to-br hover:from-sunshine/5 hover:to-coral/5 border-border hover:border-sunshine/50 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]"
              )}
            >
              {option}
            </button>
          )
        })}
      </div>

      <AnswerFeedback
        feedback={feedback}
        hideOnWrong
        gameType="letter-match"
        hintContext={{ target: question.target.letter }}
      />
    </div>
  )
}
