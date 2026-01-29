"use client"

import { cn } from "@/lib/utils"
import type { DemoStep } from "./types"

type DemoWordMatchProps = {
  step: DemoStep
}

export function DemoWordMatch({ step }: DemoWordMatchProps) {
  const { targetEmoji, options, correctIndex, selectedIndex } = step.data || {}
  const isWrongState = step.state === "answer-wrong"
  const isCorrectState = step.state === "answer-correct"
  const isRetryState = step.state === "retry"

  return (
    <div className="p-6 pb-16">
      {/* Target Emoji Card */}
      <div className="text-center mb-6 animate-pop-in">
        <div className="inline-flex flex-col items-center gap-1">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-soft-lg border-2 border-sunshine/20">
            <div className="text-6xl md:text-7xl">
              {targetEmoji}
            </div>
          </div>
        </div>
      </div>

      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 animate-slide-up max-w-md mx-auto">
        {options?.map((option, index) => {
          const isCorrect = index === correctIndex
          const isSelected = index === selectedIndex
          const showWrong = isWrongState && isSelected && !isCorrect
          const showCorrect = (isCorrectState || isRetryState) && isSelected && isCorrect

          return (
            <div
              key={index}
              className={cn(
                "min-h-[80px] md:min-h-[100px] rounded-2xl p-4",
                "flex items-center justify-center",
                "text-2xl md:text-3xl font-display font-bold",
                "transition-all duration-300 transform",
                "border-3 shadow-soft",
                showCorrect
                  ? "bg-gradient-to-br from-sage to-emerald-500 text-white border-sage scale-105 shadow-glow"
                  : showWrong
                  ? "bg-gradient-to-br from-destructive to-red-600 text-white border-destructive"
                  : "bg-card border-border text-bark"
              )}
            >
              {option}
            </div>
          )
        })}
      </div>

      {/* Feedback message */}
      {isWrongState && (
        <div className="text-center mt-4 animate-pop-in">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-destructive/20 to-red-100 px-6 py-3 rounded-xl">
            <span className="text-xl font-display font-bold text-destructive">
              Try again!
            </span>
          </div>
        </div>
      )}

      {isCorrectState && (
        <div className="text-center mt-4 animate-pop-in">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sage/20 to-emerald-100 px-6 py-3 rounded-xl">
            <span className="text-2xl">🎉</span>
            <span className="text-xl font-display font-bold text-sage">
              Amazing!
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
