"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakIndicatorProps {
  streak: number
  targetStreak?: number
}

export function StreakIndicator({
  streak,
  targetStreak = 3,
}: StreakIndicatorProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-3">
      <span className="text-sm font-semibold text-muted-foreground hidden sm:block">
        Streak
      </span>
      <div className="flex gap-1">
        {Array.from({ length: targetStreak }).map((_, i) => {
          const isFilled = i < streak
          return (
            <div
              key={i}
              className={cn(
                "relative transition-all duration-300",
                isFilled && "animate-pop-in"
              )}
              style={{ animationDelay: isFilled ? `${i * 0.1}s` : undefined }}
            >
              <Star
                className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300",
                  isFilled
                    ? "fill-sunshine text-sunshine drop-shadow-md scale-110"
                    : "fill-muted/30 text-muted/50 scale-100"
                )}
              />
              {isFilled && (
                <div className="absolute inset-0 animate-pulse-glow rounded-full" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

