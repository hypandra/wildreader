"use client"

import { FileText } from "lucide-react"
import { motion } from "motion/react"

type TargetCardProps = {
  targetId: string
  onSpeakTarget: () => void
  onSpeakDirections: () => void
  instructionText?: string
}

export function TargetCard({ targetId, onSpeakTarget, onSpeakDirections, instructionText }: TargetCardProps) {
  return (
    <motion.div
      key={targetId}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center"
    >
      <div className="inline-flex flex-col items-center gap-2 bg-white/90 backdrop-blur-sm rounded-3xl px-5 py-4 shadow-xl border-2 border-amber-200">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-lg sm:text-xl font-normal text-slate-800 tracking-[0.2em]"
          onClick={onSpeakTarget}
          aria-label="Hear the word"
        >
          splat this word
          <span className="text-xl sm:text-2xl">🔊</span>
        </button>
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-normal text-slate-500">
          <button
            type="button"
            className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white border border-amber-200 shadow-sm"
            onClick={onSpeakDirections}
            aria-label="Hear the directions"
          >
            <FileText className="h-4 w-4" />
          </button>
          <span>{instructionText || "Click a word to make it splat."}</span>
        </div>
      </div>
    </motion.div>
  )
}
