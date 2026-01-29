"use client"

type SightWordSplatterHeaderProps = {
  wordsFound: number
}

export function SightWordSplatterHeader({ wordsFound }: SightWordSplatterHeaderProps) {
  return (
    <div className="relative w-full h-0 z-30">
      <div className="absolute right-0 top-0 flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-amber-200 border-t-0 rounded-b-2xl rounded-t-none px-4 py-2 shadow-md z-30">
        <span className="text-sm font-semibold text-slate-600 tracking-wide">
          words found
        </span>
        <span className="text-2xl font-bold text-amber-600">{wordsFound}</span>
      </div>
    </div>
  )
}
