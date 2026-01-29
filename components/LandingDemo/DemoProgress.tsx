"use client"

import { cn } from "@/lib/utils"

type DemoProgressProps = {
  currentIndex: number
  total: number
  onDotClick?: (index: number) => void
}

export function DemoProgress({ currentIndex, total, onDotClick }: DemoProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-3">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation() // Prevent triggering parent container's onClick
            onDotClick?.(index)
          }}
          className={cn(
            "h-3 rounded-full transition-all duration-300",
            "hover:scale-125 focus:outline-none focus:ring-2 focus:ring-coral/50",
            index === currentIndex
              ? "w-6 bg-coral"
              : index < currentIndex
              ? "w-3 bg-sage/60 hover:bg-sage"
              : "w-3 bg-muted hover:bg-muted-foreground/30"
          )}
          aria-label={`Go to step ${index + 1}`}
          aria-current={index === currentIndex ? "step" : undefined}
        />
      ))}
    </div>
  )
}
