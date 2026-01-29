"use client"

import Link from "next/link"
import { Star, Sparkles, Home, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StreakIndicator } from "./StreakIndicator"
import { LearnerSelector } from "@/components/LearnerSelector"
import type { Difficulty } from "@/types"

interface GameHeaderProps {
  streak: number
  totalStars: number
  gameName: string
  pendingReward?: { imageUrl?: string } | null
  onRecoverReward?: () => void
  difficulty?: Difficulty
  difficultyLevels?: Difficulty[]
  onDifficultyChange?: (level: Difficulty) => void
}

export function GameHeader({
  streak,
  totalStars,
  gameName,
  pendingReward,
  onRecoverReward,
  difficulty,
  difficultyLevels,
  onDifficultyChange,
}: GameHeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/95 border-b border-sunshine/10 shadow-sm">
      {/* Main header row */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Left side - Back button and game name */}
        <div className="flex items-center gap-1 sm:gap-3 min-w-0">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-coral/10 hover:text-coral transition-all duration-200 group shrink-0"
            >
              <Home className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
            </Button>
          </Link>

          <h1 className="text-sm sm:text-lg md:text-xl font-display font-bold text-bark truncate">
            {gameName}
          </h1>

          {/* Pending reward recovery button */}
          {pendingReward && onRecoverReward && (
            <Button
              onClick={onRecoverReward}
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-auto sm:w-auto sm:px-3 rounded-xl bg-gradient-to-r from-sunshine/20 to-coral/20 hover:from-sunshine/30 hover:to-coral/30 border border-sunshine/30 shrink-0"
            >
              <Gift className="h-5 w-5 text-coral sm:mr-2" />
              <span className="hidden sm:inline text-sm font-semibold text-bark">
                {pendingReward.imageUrl ? "View Reward" : "Claim Reward"}
              </span>
            </Button>
          )}
        </div>

        {/* Right side - Streak and stars */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <LearnerSelector />
            {difficulty && difficultyLevels && onDifficultyChange && (
              <label className="flex items-center gap-2 rounded-2xl border border-sunshine/20 bg-card/80 px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Level</span>
                <select
                  value={difficulty}
                  onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
                  className="bg-transparent text-sm font-display font-bold text-bark focus:outline-none"
                >
                  {difficultyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <StreakIndicator streak={streak} />

          {/* Star counter */}
          <div className="flex items-center gap-1 bg-gradient-to-r from-sunshine/20 to-amber-100/40 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-sunshine/30">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-sunshine text-sunshine" />
            <span className="text-base sm:text-lg font-display font-bold text-bark">
              {totalStars}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile secondary row - Learner selector */}
      <div className="sm:hidden px-2 pb-1 flex items-center justify-end gap-2">
        <LearnerSelector buttonClassName="bg-transparent border-transparent" />
        {difficulty && difficultyLevels && onDifficultyChange && (
          <label className="flex items-center gap-2 rounded-2xl border border-sunshine/20 bg-card/80 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Level</span>
            <select
              value={difficulty}
              onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
              className="bg-transparent text-sm font-display font-bold text-bark focus:outline-none"
            >
              {difficultyLevels.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </header>
  )
}
