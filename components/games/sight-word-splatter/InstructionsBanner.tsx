"use client"

type InstructionsBannerProps = {
  text?: string
  onSpeakDirections: () => void
}

export function InstructionsBanner({ text, onSpeakDirections }: InstructionsBannerProps) {
  return (
    <div className="flex items-center gap-3 text-sm sm:text-base font-semibold text-slate-600 bg-white/80 backdrop-blur-sm border border-amber-200 px-4 py-2 rounded-full shadow-sm">
      <span>{text || "Click a word to make it splat."}</span>
      <button
        type="button"
        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white border border-amber-200 shadow-sm text-base"
        onClick={onSpeakDirections}
        aria-label="Hear the directions"
      >
        🔊
      </button>
    </div>
  )
}
