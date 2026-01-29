"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DemoStaticFallback() {
  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-card rounded-2xl border-2 border-sunshine/30 shadow-soft-lg">
      <h3 className="text-2xl font-display font-bold mb-6 text-center text-bark">
        See How It Works
      </h3>

      <div className="space-y-8">
        {/* Letter Match */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-4 mb-3">
            <div className="bg-card/80 rounded-xl px-4 py-3 shadow-soft border-2 border-sunshine/20">
              <span className="text-4xl font-display font-bold text-bark">B</span>
            </div>
            <span className="text-2xl text-muted-foreground">=</span>
            <div className="bg-gradient-to-br from-sage to-emerald-500 rounded-xl px-4 py-3 shadow-soft">
              <span className="text-4xl font-display font-bold text-white">b</span>
            </div>
          </div>
          <p className="text-muted-foreground">
            Match uppercase and lowercase letters
          </p>
        </div>

        {/* Word Match */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-4 mb-3">
            <div className="bg-card/80 rounded-xl px-4 py-3 shadow-soft border-2 border-sunshine/20">
              <span className="text-4xl">🐱</span>
            </div>
            <span className="text-2xl text-muted-foreground">=</span>
            <div className="bg-gradient-to-br from-sage to-emerald-500 rounded-xl px-4 py-3 shadow-soft">
              <span className="text-2xl font-display font-bold text-white">cat</span>
            </div>
          </div>
          <p className="text-muted-foreground">
            Match pictures to words
          </p>
        </div>

        {/* Reward */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-4 mb-3">
            <div className="flex items-center gap-2 bg-sunshine/20 rounded-xl px-4 py-3">
              <span className="text-2xl">⭐</span>
              <span className="text-2xl">⭐</span>
              <span className="text-2xl">⭐</span>
            </div>
            <span className="text-2xl text-muted-foreground">=</span>
            <div className="bg-gradient-to-br from-lavender/30 to-coral/30 rounded-xl px-4 py-3 shadow-soft">
              <span className="text-4xl">🎨</span>
            </div>
          </div>
          <p className="text-muted-foreground">
            Earn AI-generated pictures as rewards!
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link href="/signup">
          <Button
            className="h-14 px-8 rounded-2xl font-display font-bold text-lg bg-gradient-to-r from-sunshine to-amber-400 text-bark hover:from-amber-400 hover:to-sunshine shadow-tactile hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Get Started Free
          </Button>
        </Link>
      </div>
    </div>
  )
}
