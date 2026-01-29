import { useEffect, useState } from "react"
import { getCorrectPhrase, getGameHint, speakCorrectFeedback, speakHint } from "@/lib/audio"
import { useAudio } from "@/lib/contexts/AudioContext"
import { cn } from "@/lib/utils"
import type { GameType } from "@/types"

type AnswerFeedbackProps = {
  feedback: "correct" | "wrong" | null
  hideOnWrong?: boolean
  gameType?: GameType
  hintContext?: { target?: string; correctAnswer?: string }
}

export function AnswerFeedback({
  feedback,
  hideOnWrong = false,
  gameType,
  hintContext,
}: AnswerFeedbackProps) {
  const { audioEnabled } = useAudio()
  const [correctPhrase, setCorrectPhrase] = useState<string | null>(null)

  // Handle feedback changes - pick phrase and speak
  useEffect(() => {
    if (feedback === "correct") {
      const phrase = getCorrectPhrase()
      setCorrectPhrase(phrase)
      if (audioEnabled) {
        speakCorrectFeedback(phrase)
      }
    } else if (feedback === "wrong" && gameType && audioEnabled && !hideOnWrong) {
      speakHint(gameType, hintContext)
    } else if (feedback === null) {
      setCorrectPhrase(null)
    }
  }, [feedback, gameType, hintContext, audioEnabled, hideOnWrong])

  if (!feedback || (hideOnWrong && feedback === "wrong")) {
    return null
  }

  const hint = gameType && feedback === "wrong" ? getGameHint(gameType, hintContext) : null

  return (
    <div
      className={cn(
        "text-center mt-4 animate-pop-in",
        "inline-flex flex-col items-center justify-center gap-2 px-6 py-3 rounded-xl mx-auto",
        "font-display font-bold",
        feedback === "correct"
          ? "bg-gradient-to-r from-sage/20 to-emerald-100 text-sage"
          : "bg-gradient-to-r from-destructive/20 to-red-100 text-destructive"
      )}
      style={{ display: "block" }}
    >
      <div className="text-2xl">
        <span className="mr-1">
          {feedback === "correct" ? "🎉" : ""}
        </span>
        {feedback === "correct" ? (correctPhrase || "Amazing!") : "Not quite"}
      </div>
      {hint && (
        <p className="text-base font-medium text-muted-foreground mt-1">
          {hint}
        </p>
      )}
    </div>
  )
}
