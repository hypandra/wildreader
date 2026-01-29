/* eslint-disable @next/next/no-img-element */
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AudioButton } from "@/components/AudioButton"
import { AnswerFeedback } from "@/components/games/AnswerFeedback"
import { getGameInstruction, speakGameInstruction, speak } from "@/lib/audio"
import { useAudio } from "@/lib/contexts/AudioContext"
import { generateNameToFaceQuestion } from "@/lib/games"
import { getCorrectRate } from "@/lib/mastery"
import { cn } from "@/lib/utils"
import type { Person } from "@/types"

type GameItemType = "letter" | "vocabulary" | "person"

type NameToFaceGameProps = {
  people: Person[]
  onCorrect: (itemId: string, itemType: GameItemType) => void
  onWrong: (itemId: string, itemType: GameItemType) => void
  onComplete: (wasCorrect: boolean, hadMistakes: boolean) => void
  rewardDialogOpen?: boolean
}

type NameToFaceQuestion = NonNullable<ReturnType<typeof generateNameToFaceQuestion>>

export function NameToFaceGame({
  people,
  onCorrect,
  onWrong,
  onComplete,
  rewardDialogOpen,
}: NameToFaceGameProps) {
  const router = useRouter()
  const { audioEnabled } = useAudio()
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [wrongIndices, setWrongIndices] = useState<number[]>([])
  const [hadMistake, setHadMistake] = useState(false)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [question, setQuestion] = useState<NameToFaceQuestion | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTargetIdRef = useRef<string | null>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Auto-play audio instruction when question changes (with delay for pacing)
  useEffect(() => {
    if (question && audioEnabled && !rewardDialogOpen) {
      const audioTimeout = setTimeout(() => {
        speakGameInstruction("name-to-face", question.targetName)
      }, 1500) // 1.5s pause before instruction
      return () => clearTimeout(audioTimeout)
    }
  }, [question, audioEnabled, rewardDialogOpen])

  const generateQuestion = useCallback(() => {
    // Wait for people data to be loaded
    if (people.length === 0) {
      console.log("[NameToFace] Waiting for people data...")
      return
    }

    console.log("[NameToFace] Generating question with", people.length, "people")

    setSelectedIndices([])
    setWrongIndices([])
    setHadMistake(false)
    setFeedback(null)

    try {
      // Try up to 5 times to get a different person than last round
      let nextQuestion: NameToFaceQuestion | null = null
      for (let attempt = 0; attempt < 5; attempt++) {
        nextQuestion = generateNameToFaceQuestion()
        if (!nextQuestion) break
        if (nextQuestion.targetId !== lastTargetIdRef.current) break
      }

      if (!nextQuestion) {
        console.log("[NameToFace] No question generated, redirecting to faces setup")
        router.push("/settings/faces")
        return
      }

      lastTargetIdRef.current = nextQuestion.targetId
      setQuestion(nextQuestion)
    } catch (error) {
      console.error("[NameToFace] Error generating question:", error)
      timeoutRef.current = setTimeout(() => generateQuestion(), 1000)
    }
  }, [people.length, router])

  useEffect(() => {
    generateQuestion()
  }, [generateQuestion])

  const handleAnswer = (index: number) => {
    if (!question || feedback) return

    const isCorrect = index === question.correctIndex

    if (isCorrect) {
      setSelectedIndices([index])
      setFeedback("correct")
      onCorrect(question.targetId, "person")

      timeoutRef.current = setTimeout(() => {
        onComplete(true, hadMistake)
        generateQuestion()
      }, 1500)
      return
    }

    if (!wrongIndices.includes(index)) {
      setWrongIndices((prev) => [...prev, index])
      onWrong(question.targetId, "person")
    }
    setHadMistake(true)
    setFeedback("wrong")
    onComplete(false, true)

    // Audio feedback - don't say the name, encourage reading
    if (audioEnabled) {
      speak("Not quite. Read the name again.")
    }

    timeoutRef.current = setTimeout(() => {
      setFeedback(null)
    }, 900)
  }

  if (!question) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <p className="text-xl font-display text-bark">Loading name to face...</p>
      </div>
    )
  }

  // Get mastery for the target person
  const targetPerson = question.options.find(p => p.id === question.targetId)
  const masteryData = targetPerson?.mastery?.["name-to-face"]
  const masteryPercent = masteryData ? Math.round(getCorrectRate(masteryData) * 100) : 0
  const hasAttempts = masteryData && masteryData.attempts > 0

  return (
    <div>
      <div className="text-center mb-6 animate-pop-in">
        <div className="inline-flex flex-col items-center gap-1">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-soft-lg border-2 border-sunshine/20">
            <p className="text-4xl sm:text-5xl md:text-6xl font-display text-bark">
              {question.targetName}
            </p>
            {/* Mastery progress bar */}
            <div className="mt-3 w-full">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    masteryPercent >= 80 ? "bg-sage" :
                    masteryPercent >= 50 ? "bg-sunshine" :
                    "bg-coral/60"
                  )}
                  style={{ width: hasAttempts ? `${Math.max(masteryPercent, 5)}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {hasAttempts ? `${masteryPercent}% mastery` : "New!"}
              </p>
            </div>
          </div>
          <AudioButton
            text={getGameInstruction("name-to-face", question.targetName)}
            size="sm"
            variant="ghost"
            className="opacity-60 hover:opacity-100"
          />
        </div>

        <p className="text-base text-muted-foreground font-medium mt-3">
          Which face is {question.targetName}?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 animate-slide-up">
        {question.options.map((person, index) => {
          const isSelected = selectedIndices.includes(index)
          const isCorrect = index === question.correctIndex
          const isWrong = wrongIndices.includes(index)

          return (
            <button
              key={`${person.id}-${index}`}
              onClick={() => !feedback && !isWrong && handleAnswer(index)}
              disabled={feedback !== null || isWrong}
              className={cn(
                "relative rounded-2xl p-2 md:p-3",
                "flex items-center justify-center",
                "transition-all duration-300 transform",
                "border-3 shadow-soft",
                feedback !== null && "cursor-not-allowed",
                isWrong
                  ? "bg-gradient-to-br from-destructive to-red-600 border-destructive opacity-60"
                  : feedback === "correct" && isSelected && isCorrect
                  ? "bg-gradient-to-br from-sage to-emerald-500 border-sage scale-105 shadow-glow animate-celebrate"
                  : "bg-card hover:bg-gradient-to-br hover:from-sunshine/5 hover:to-coral/5 border-border hover:border-sunshine/50 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]"
              )}
            >
              {person.imageUrl ? (
                <img
                  src={person.imageUrl}
                  alt="Person"
                  className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 object-cover rounded-xl"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-muted rounded-xl flex items-center justify-center text-4xl">
                  👤
                </div>
              )}
            </button>
          )
        })}
      </div>

      <AnswerFeedback
        feedback={feedback}
        gameType="name-to-face"
        hintContext={{ target: question.targetName }}
        hideOnWrong={true}
      />
    </div>
  )
}
