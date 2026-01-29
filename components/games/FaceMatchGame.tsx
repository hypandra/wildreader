/* eslint-disable @next/next/no-img-element */
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AudioButton } from "@/components/AudioButton"
import { AnswerFeedback } from "@/components/games/AnswerFeedback"
import { DifficultySelector } from "@/components/games/DifficultySelector"
import { getGameInstruction, speakGameInstruction, speak } from "@/lib/audio"
import { useAudio } from "@/lib/contexts/AudioContext"
import { generateFaceMatchQuestion } from "@/lib/games"
import { cn } from "@/lib/utils"
import type { Difficulty, Person } from "@/types"

type GameItemType = "letter" | "vocabulary" | "person"

type FaceMatchGameProps = {
  people: Person[]
  initialDifficulty?: Difficulty
  onDifficultyChange?: (level: Difficulty) => void
  onCorrect: (itemId: string, itemType: GameItemType) => void
  onWrong: (itemId: string, itemType: GameItemType) => void
  onComplete: (wasCorrect: boolean, hadMistakes: boolean) => void
  rewardDialogOpen?: boolean
}

type FaceMatchQuestion = NonNullable<ReturnType<typeof generateFaceMatchQuestion>>

export function FaceMatchGame({
  people,
  initialDifficulty,
  onDifficultyChange,
  onCorrect,
  onWrong,
  onComplete,
  rewardDialogOpen,
}: FaceMatchGameProps) {
  const router = useRouter()
  const { audioEnabled } = useAudio()
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty ?? "easy")
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [wrongIndices, setWrongIndices] = useState<number[]>([])
  const [hadMistake, setHadMistake] = useState(false)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [question, setQuestion] = useState<FaceMatchQuestion | null>(null)
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
      speakGameInstruction("face-match", question.target.name)
    }
  }, [question, audioEnabled, rewardDialogOpen])

  const generateQuestion = useCallback(() => {
    setSelectedIndices([])
    setWrongIndices([])
    setHadMistake(false)
    setFeedback(null)

    try {
      const nextQuestion = generateFaceMatchQuestion(difficulty)
      if (!nextQuestion) {
        router.push("/settings/faces")
        return
      }
      setQuestion(nextQuestion)
    } catch (error) {
      console.error("Error generating face match question:", error)
      timeoutRef.current = setTimeout(() => generateQuestion(), 1000)
    }
  }, [difficulty, router])

  useEffect(() => {
    generateQuestion()
  }, [generateQuestion])

  const handleAnswer = (index: number) => {
    if (!question || feedback) return

    const isCorrect = index === question.correctIndex
    const clickedName = question.options[index]
    const correctName = question.target.name

    if (isCorrect) {
      setSelectedIndices([index])
      setFeedback("correct")
      onCorrect(question.target.id, "person")

      // Audio feedback: "Yes, {name}!"
      if (audioEnabled) {
        speak(`Yes, ${correctName}!`)
      }

      timeoutRef.current = setTimeout(() => {
        onComplete(true, hadMistake)
        generateQuestion()
      }, 1500)
      return
    }

    if (!wrongIndices.includes(index)) {
      setWrongIndices((prev) => [...prev, index])
      onWrong(question.target.id, "person")
    }
    setHadMistake(true)
    setFeedback("wrong")
    onComplete(false, true)

    // Audio feedback: "You clicked {wrongName}, look for {correctName}"
    if (audioEnabled) {
      speak(`You clicked ${clickedName}, look for ${correctName}`)
    }

    timeoutRef.current = setTimeout(() => {
      setFeedback(null)
    }, 900)
  }

  if (!question) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <p className="text-xl font-display text-bark">Loading face match...</p>
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
        colorScheme="coral"
      />

      <div className="text-center mb-4 animate-pop-in">
        <div className="inline-flex flex-col items-center gap-1">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-soft-lg border-2 border-sunshine/20">
            {question.target.imageUrl ? (
              <img
                src={question.target.imageUrl}
                alt="Who is this?"
                className="w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 object-cover rounded-2xl mx-auto border-2 border-sunshine/30"
              />
            ) : (
              <div className="w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 bg-muted rounded-2xl flex items-center justify-center text-5xl">
                👤
              </div>
            )}
          </div>
          <AudioButton
            text={getGameInstruction("face-match", question.target.name)}
            size="sm"
            variant="ghost"
            className="opacity-60 hover:opacity-100"
          />
        </div>

        <p className="text-base text-muted-foreground font-medium mt-2">
          Who is this person?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 animate-slide-up">
        {question.options.map((option, index) => {
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
              <div
                className="absolute bottom-1 right-1"
                onClick={(e) => e.stopPropagation()}
              >
                <AudioButton
                  text={option}
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
        gameType="face-match"
        hintContext={{ target: question.target.name }}
        hideOnWrong={true}
      />
    </div>
  )
}
