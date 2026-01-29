import { useCallback, useState } from "react"
import type { SessionState } from "@/types"

type UseGameSessionOptions = {
  session: SessionState
  updateSession: (updates: Partial<SessionState>) => Promise<void>
  onAdvance: () => void
  streakTarget?: number
  disableRewards?: boolean
}

export function useGameSession({
  session,
  updateSession,
  onAdvance,
  streakTarget = 3,
  disableRewards = false,
}: UseGameSessionOptions) {
  const [showRewardDialog, setShowRewardDialog] = useState(false)
  const [rewardStreak, setRewardStreak] = useState(0)
  const [pendingReward, setPendingReward] = useState<{ imageUrl?: string } | null>(null)

  const handleCorrectAnswer = useCallback(() => {
    const newStars = session.totalStars + 1
    const newStreak = session.streak + 1

    if (disableRewards) {
      updateSession({ streak: 0, totalStars: newStars })
      onAdvance()
      return
    }

    if (newStreak >= streakTarget) {
      setRewardStreak(newStreak)
      updateSession({ streak: 0, totalStars: newStars })
      setPendingReward({})
      setShowRewardDialog(true)
      return
    }

    updateSession({ streak: newStreak, totalStars: newStars })
    onAdvance()
  }, [disableRewards, onAdvance, session.streak, session.totalStars, streakTarget, updateSession])

  const handleWrongAnswer = useCallback(() => {
    updateSession({ streak: 0, totalStars: session.totalStars })
    onAdvance()
  }, [onAdvance, session.totalStars, updateSession])

  const handleRewardComplete = useCallback(() => {
    setShowRewardDialog(false)
    setPendingReward(null)
    onAdvance()
  }, [onAdvance])

  const handleRewardDismiss = useCallback((imageUrl?: string) => {
    if (imageUrl) {
      setPendingReward({ imageUrl })
    }
    setShowRewardDialog(false)
  }, [])

  const handleRecoverReward = useCallback(() => {
    setShowRewardDialog(true)
  }, [])

  return {
    streak: session.streak,
    totalStars: session.totalStars,
    pendingReward,
    rewardStreak,
    showRewardDialog,
    setShowRewardDialog,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleRewardComplete,
    handleRewardDismiss,
    handleRecoverReward,
  }
}
