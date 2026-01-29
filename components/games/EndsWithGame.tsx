"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AudioButton } from "@/components/AudioButton"
import { AnswerFeedback } from "@/components/games/AnswerFeedback"
import { getGameInstruction, speakGameInstruction } from "@/lib/audio"
import { useAudio } from "@/lib/contexts/AudioContext"
import { generateEndsWithQuestion } from "@/lib/games"
import { getCorrectRate } from "@/lib/mastery"
import { cn } from "@/lib/utils"
import type { VocabularyItem } from "@/types"

type GameItemType = "letter" | "vocabulary" | "person"

type EndsWithGameProps = {
  vocabulary: VocabularyItem[]
  onCorrect: (itemId: string, itemType: GameItemType) => void
  onWrong: (itemId: string, itemType: GameItemType) => void
  onComplete: (wasCorrect: boolean, hadMistakes: boolean) => void
  rewardDialogOpen?: boolean
}

type EndsWithQuestion = ReturnType<typeof generateEndsWithQuestion>

export function EndsWithGame({
  vocabulary,
  onCorrect,
  onWrong,
  onComplete,
  rewardDialogOpen,
}: EndsWithGameProps) {
  const { audioEnabled } = useAudio()
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [wrongIndices, setWrongIndices] = useState<number[]>([])
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [question, setQuestion] = useState<EndsWithQuestion | null>(null)
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
      speakGameInstruction("ends-with", question.target.word)
    }
  }, [question, audioEnabled, rewardDialogOpen])

  const generateQuestion = useCallback(() => {
    if (!vocabulary.length) return

    setSelectedIndices([])
    setWrongIndices([])
    setFeedback(null)

    try {
      setQuestion((prevQuestion) => {
        const prevTarget = prevQuestion?.target
        const target = prevTarget ? vocabulary.find((item) => item.id === prevTarget.id) : null
        const mastery = target?.mastery["ends-with"]
        const stage = mastery && getCorrectRate(mastery) > 0.8 && mastery.attempts >= 5 ? 2 : 1
        return generateEndsWithQuestion(stage as 1 | 2)
      })
    } catch (error) {
      console.error("Error generating ends with question:", error)
      timeoutRef.current = setTimeout(() => generateQuestion(), 1000)
    }
  }, [vocabulary])

  useEffect(() => {
    generateQuestion()
  }, [generateQuestion])

  const handleAnswer = (index: number) => {
    if (!question || feedback) return

    const stage = question.correctIndices.length > 1 ? 2 : 1

    if (stage === 1) {
      const isCorrect = question.correctIndices.includes(index)
      setSelectedIndices([index])
      setFeedback(isCorrect ? "correct" : "wrong")

      if (isCorrect) {
        onCorrect(question.target.id, "vocabulary")
      } else {
        onWrong(question.target.id, "vocabulary")
        setWrongIndices([index])
      }

      timeoutRef.current = setTimeout(() => {
        onComplete(isCorrect, false)
        generateQuestion()
      }, isCorrect ? 2500 : 1500)
      return
    }

    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((item) => item !== index))
      setWrongIndices(wrongIndices.filter((item) => item !== index))
      return
    }

    const newSelected = [...selectedIndices, index]
    setSelectedIndices(newSelected)
    if (!question.correctIndices.includes(index)) {
      setWrongIndices([...wrongIndices, index])
    }

    const allCorrect = question.correctIndices.every((item) => newSelected.includes(item))
    const anyWrong = newSelected.some((item) => !question.correctIndices.includes(item))

    if (allCorrect && newSelected.length === question.correctIndices.length && !anyWrong) {
      setFeedback("correct")
      onCorrect(question.target.id, "vocabulary")
      timeoutRef.current = setTimeout(() => {
        onComplete(true, false)
        generateQuestion()
      }, 2500)
    }
  }

  if (!question) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <p className="text-xl font-display text-bark">Loading ends with...</p>
      </div>
    )
  }

  const showPicture =
    getCorrectRate(question.target.mastery["ends-with"]) <= 0.8 ||
    question.target.mastery["ends-with"].attempts < 5

  return (
    <div>
      <div className="text-center mb-4 animate-pop-in">
        <div className="inline-flex flex-col items-center gap-1">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-soft-lg border-2 border-sunshine/20">
            <div className="text-2xl md:text-3xl font-display text-bark">
              {showPicture ? `${question.target.emoji} ${question.target.word}` : question.target.word}
            </div>
          </div>
          <AudioButton
            text={getGameInstruction("ends-with", question.target.word)}
            size="sm"
            variant="ghost"
            className="opacity-60 hover:opacity-100"
          />
        </div>

        <p className="text-base text-muted-foreground font-medium mt-2">
          Find the words that end like{" "}
          <span className="font-display text-coral">
            {question.target.word.toUpperCase()}
          </span>
          {question.correctIndices.length > 1 && (
            <span className="ml-2 text-xs bg-sky/20 text-sky-700 px-2 py-0.5 rounded-full">
              Select all that apply
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 animate-slide-up">
        {question.options.map((option, index) => {
          const isSelected = selectedIndices.includes(index)
          const isCorrect = question.correctIndices.includes(index)
          // Show only emoji initially, reveal word after feedback
          const showWord = feedback !== null
          const displayContent = showWord ? `${option.emoji} ${option.word}` : option.emoji

          return (
            <button
              key={option.id}
              onClick={() => !feedback && handleAnswer(index)}
              disabled={feedback !== null}
              className={cn(
                "relative min-h-[100px] md:min-h-[120px] rounded-2xl p-4",
                "flex items-center justify-center",
                "text-3xl md:text-4xl font-display",
                "transition-all duration-300 transform",
                "border-3 shadow-soft",
                feedback !== null && "cursor-not-allowed",
                feedback === "correct" && isSelected && isCorrect
                  ? "bg-gradient-to-br from-sage to-emerald-500 text-white border-sage scale-105 shadow-glow animate-celebrate"
                  : feedback === "wrong" && isSelected && !isCorrect
                  ? "bg-gradient-to-br from-destructive to-red-600 text-white border-destructive"
                  : isSelected
                  ? "bg-gradient-to-br from-sky-100 to-blue-100 border-sky-400 scale-105"
                  : "bg-card hover:bg-gradient-to-br hover:from-sunshine/5 hover:to-coral/5 border-border hover:border-sunshine/50 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]"
              )}
            >
              {displayContent}
              <div
                className="absolute bottom-1 right-1"
                onClick={(e) => e.stopPropagation()}
              >
                <AudioButton
                  text={option.word}
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
        gameType="ends-with"
        hintContext={{ target: question.target.word }}
      />
    </div>
  )
}
