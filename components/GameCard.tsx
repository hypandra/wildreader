"use client"

import Link from "next/link"
import { GAME_CONFIGS } from "@/lib/games"
import type { GameType } from "@/types"

interface GameCardProps {
  gameType: GameType
}

// Color variants for different game cards
const cardColors: Record<GameType, { bg: string; border: string; shadow: string }> = {
  "letter-match": {
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-200/60",
    shadow: "hover:shadow-amber-200/40",
  },
  "letter-hunt": {
    bg: "from-emerald-50 to-teal-50",
    border: "border-emerald-200/60",
    shadow: "hover:shadow-emerald-200/40",
  },
  "letter-to-picture": {
    bg: "from-sky-50 to-blue-50",
    border: "border-sky-200/60",
    shadow: "hover:shadow-sky-200/40",
  },
  "picture-to-letter": {
    bg: "from-violet-50 to-purple-50",
    border: "border-violet-200/60",
    shadow: "hover:shadow-violet-200/40",
  },
  "starts-with": {
    bg: "from-rose-50 to-pink-50",
    border: "border-rose-200/60",
    shadow: "hover:shadow-rose-200/40",
  },
  "ends-with": {
    bg: "from-cyan-50 to-sky-50",
    border: "border-cyan-200/60",
    shadow: "hover:shadow-cyan-200/40",
  },
  "word-match": {
    bg: "from-lime-50 to-green-50",
    border: "border-lime-200/60",
    shadow: "hover:shadow-lime-200/40",
  },
  "picture-match": {
    bg: "from-fuchsia-50 to-pink-50",
    border: "border-fuchsia-200/60",
    shadow: "hover:shadow-fuchsia-200/40",
  },
  "face-match": {
    bg: "from-indigo-50 to-violet-50",
    border: "border-indigo-200/60",
    shadow: "hover:shadow-indigo-200/40",
  },
  "name-to-face": {
    bg: "from-purple-50 to-indigo-50",
    border: "border-purple-200/60",
    shadow: "hover:shadow-purple-200/40",
  },
  "todays-sound": {
    bg: "from-yellow-50 to-amber-50",
    border: "border-yellow-200/60",
    shadow: "hover:shadow-yellow-200/40",
  },
  "sight-word-splatter": {
    bg: "from-red-50 to-orange-50",
    border: "border-red-200/60",
    shadow: "hover:shadow-red-200/40",
  },
  "freeplay-canvas": {
    bg: "from-amber-50 to-rose-50",
    border: "border-amber-200/60",
    shadow: "hover:shadow-amber-200/40",
  },
}

export function GameCard({ gameType }: GameCardProps) {
  const config = GAME_CONFIGS[gameType]
  const colors = cardColors[gameType]

  return (
    <Link href={`/game/${gameType}`} className="relative block group">
      {/* NEW badge for new games */}
      {gameType === "sight-word-splatter" && (
        <div className="absolute -top-2 -right-2 z-20 pointer-events-none">
          <div className="bg-gradient-to-r from-coral to-rose-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg animate-bounce-soft">
            NEW!
          </div>
        </div>
      )}

      <div
        className={`
          relative h-full p-5 rounded-3xl
          bg-gradient-to-br ${colors.bg}
          border-2 ${colors.border}
          shadow-soft
          transition-all duration-300 ease-out
          hover:scale-[1.03] hover:-translate-y-2
          hover:shadow-soft-lg ${colors.shadow}
          active:scale-[0.98] active:translate-y-0
          cursor-pointer
          overflow-hidden
        `}
      >
        {/* Decorative corner accent */}
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/40 rounded-full blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white/30 rounded-full blur-lg" />

        {/* Content */}
        <div className="relative z-10">
          {/* Emoji with bounce effect */}
          <div className="text-5xl md:text-6xl text-center mb-3 group-hover:animate-wiggle transition-transform">
            {config.emoji}
          </div>

          {/* Title */}
          <h3 className="text-lg md:text-xl font-display font-bold text-center text-bark mb-2 leading-tight">
            {config.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground text-center leading-snug">
            {config.description}
          </p>
        </div>

        {/* Hover shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
      </div>
    </Link>
  )
}
