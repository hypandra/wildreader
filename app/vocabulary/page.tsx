"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VocabularyList } from "@/components/VocabularyList"
import { RewardsList } from "@/components/RewardsList"
import { ViewModeToggle } from "@/components/ViewModeToggle"
import { useSession } from "@/lib/auth-client"
import { useChild } from "@/lib/contexts/ChildContext"
import { getRewards, deleteReward } from "@/lib/db/rewards"
import { MobileNav } from "@/components/MobileNav"
import type { RewardInstance } from "@/types"

type ViewMode = "vocabulary" | "rewards"

export default function VocabularyPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { activeChildId } = useChild()

  const [rewards, setRewards] = useState<RewardInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("vocabulary")
  const [expandedRewards, setExpandedRewards] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadRewards() {
      if (isPending) return

      if (!session?.user || !activeChildId) {
        router.push('/login')
        return
      }

      try {
        const data = await getRewards(activeChildId)
        setRewards(data.reverse())
      } catch (error) {
        console.error('Failed to load rewards:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRewards()
  }, [session, activeChildId, isPending, router])

  // Extract unique words from reward descriptions (what the child said)
  const vocabularyWords = Array.from(
    new Set(rewards.flatMap((r) => r.words))
  ).sort()

  const toggleRewardExpanded = (rewardId: string) => {
    setExpandedRewards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(rewardId)) {
        newSet.delete(rewardId)
      } else {
        newSet.add(rewardId)
      }
      return newSet
    })
  }

  const handleDeleteReward = async (rewardId: string) => {
    if (!activeChildId) return
    await deleteReward(activeChildId, rewardId)
    setRewards((prev) => prev.filter((r) => r.id !== rewardId))
    setExpandedRewards((prev) => {
      const newSet = new Set(prev)
      newSet.delete(rewardId)
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce-soft mb-4">📚</div>
          <p className="text-2xl font-display text-bark">Loading vocabulary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Mobile navigation bar */}
      <MobileNav />

      {/* Subtle decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] right-[8%] text-2xl animate-float-slow opacity-30">📚</div>
        <div className="absolute bottom-[25%] left-[5%] text-xl animate-twinkle delay-400 opacity-25">✨</div>
        <div className="absolute top-[50%] right-[3%] text-lg animate-bounce-soft opacity-20">🌟</div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 pt-16 sm:pt-8">
        {/* Header */}
        <header className="mb-8 animate-slide-up space-y-4">
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-2xl hover:bg-coral/10 hover:text-coral transition-all duration-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-lavender" />
              <h1 className="text-3xl md:text-4xl font-display font-bold text-bark">
                Vocabulary & Rewards
              </h1>
            </div>
          </div>

          {/* View mode toggle */}
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </header>

        {/* Vocabulary List View */}
        {viewMode === "vocabulary" && <VocabularyList words={vocabularyWords} />}

        {/* Rewards Log View */}
        {viewMode === "rewards" && (
          <RewardsList
            rewards={rewards}
            expandedRewards={expandedRewards}
            onToggleReward={toggleRewardExpanded}
            onDeleteReward={handleDeleteReward}
          />
        )}
      </div>
    </div>
  )
}

