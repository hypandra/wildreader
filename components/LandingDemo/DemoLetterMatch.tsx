"use client"

import { cn } from "@/lib/utils"
import type { DemoStep } from "./types"

type DemoLetterMatchProps = {
  step: DemoStep
}

export function DemoLetterMatch({ step }: DemoLetterMatchProps) {
  const { target, options, correctIndex, selectedIndex } = step.data || {}
  const isAnswerState = step.state === "answer-correct"

  return (
    <div className="p-6 pb-16">
      {/* Target Letter Card */}
      <div className="text-center mb-6 animate-pop-in">
        <div className="inline-flex flex-col items-center gap-1">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-soft-lg border-2 border-sunshine/20">
            <div className="text-6xl md:text-7xl font-display font-bold text-bark">
              {target}
            </div>
          </div>
        </div>
      </div>

      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 animate-slide-up max-w-md mx-auto">
        {options?.map((option, index) => {
          const isCorrect = index === correctIndex
          const isSelected = index === selectedIndex

          return (
            <div
              key={index}
              className={cn(
                "min-h-[80px] md:min-h-[100px] rounded-2xl p-4",
                "flex items-center justify-center",
                "text-3xl md:text-4xl font-display font-bold",
                "transition-all duration-300 transform",
                "border-3 shadow-soft",
                isAnswerState && isSelected && isCorrect
                  ? "bg-gradient-to-br from-sage to-emerald-500 text-white border-sage scale-105 shadow-glow"
                  : "bg-card border-border text-bark"
              )}
            >
              {option}
            </div>
          )
        })}
      </div>

      {/* Feedback message */}
      {isAnswerState && (
        <div className="text-center mt-4 animate-pop-in">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sage/20 to-emerald-100 px-6 py-3 rounded-xl">
            <span className="text-2xl">🎉</span>
            <span className="text-xl font-display font-bold text-sage">
              Great job!
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
