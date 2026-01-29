/* eslint-disable @next/next/no-img-element */
"use client"

import { Loader2, Sparkles, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DemoStep } from "./types"

type DemoRewardProps = {
  step: DemoStep
}

export function DemoReward({ step }: DemoRewardProps) {
  const { rewardImage, rewardPrompt } = step.data || {}
  const isGenerating = step.state === "generating"

  if (isGenerating) {
    return (
      <div className="p-8 pb-16 flex flex-col items-center justify-center min-h-[350px]">
        {/* Celebration header */}
        <div className="text-center mb-8 animate-pop-in">
          <div className="text-5xl mb-4 animate-bounce-soft">🎉</div>
          <h3 className="text-2xl md:text-3xl font-display font-bold text-bark mb-2">
            You earned a reward!
          </h3>
          <p className="text-muted-foreground">
            Creating your special picture...
          </p>
        </div>

        {/* Generating animation */}
        <div className="relative">
          <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-lavender/30 to-coral/30 flex items-center justify-center animate-pulse">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Wand2 className="h-12 w-12 text-lavender animate-wiggle" />
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-sunshine animate-twinkle" />
              </div>
              <Loader2 className="h-6 w-6 text-coral animate-spin" />
            </div>
          </div>

          {/* Floating sparkles */}
          <div className="absolute -top-4 -left-4 text-2xl animate-float">✨</div>
          <div className="absolute -top-2 -right-6 text-xl animate-float-slow delay-200">⭐</div>
          <div className="absolute -bottom-2 -left-6 text-xl animate-twinkle delay-300">🌟</div>
          <div className="absolute -bottom-4 -right-4 text-2xl animate-float delay-400">💫</div>
        </div>

        {/* Prompt preview */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground italic">
            &quot;{rewardPrompt}&quot;
          </p>
        </div>
      </div>
    )
  }

  // Result state - show the generated image
  return (
    <div className="p-6 pb-16 flex flex-col items-center">
      {/* Success header */}
      <div className="text-center mb-4 animate-pop-in">
        <h3 className="text-xl md:text-2xl font-display font-bold text-bark">
          Your Picture!
        </h3>
      </div>

      {/* Generated image */}
      <div className="relative animate-pop-in">
        <div className={cn(
          "w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden",
          "shadow-soft-lg border-4 border-sunshine/50",
          "bg-gradient-to-br from-cream to-sunshine/20"
        )}>
          {rewardImage ? (
            <img
              src={rewardImage}
              alt={rewardPrompt || "AI generated reward"}
              className="w-full h-full object-cover"
            />
          ) : (
            // Placeholder if image not loaded
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lavender/20 to-coral/20">
              <Sparkles className="h-12 w-12 text-sunshine animate-pulse" />
            </div>
          )}
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl shadow-glow pointer-events-none" />

        {/* Decorative sparkles */}
        <div className="absolute -top-3 -right-3 text-2xl animate-twinkle">✨</div>
        <div className="absolute -bottom-3 -left-3 text-2xl animate-twinkle delay-200">✨</div>
      </div>
    </div>
  )
}
