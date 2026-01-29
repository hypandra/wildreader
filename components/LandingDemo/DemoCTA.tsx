"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DemoCTA() {
  return (
    <div className="p-8 pb-16 flex flex-col items-center justify-center min-h-[350px] animate-pop-in">
      {/* Celebration */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl md:text-3xl font-display font-bold text-bark mb-2">
          Ready to Play?
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Join Wild Reader and start your reading adventure today!
        </p>
      </div>

      {/* CTA Button */}
      <Link href="/signup" onClick={(e) => e.stopPropagation()}>
        <Button
          className="h-16 px-10 rounded-2xl font-display font-bold text-xl bg-gradient-to-r from-sunshine to-amber-400 text-bark hover:from-amber-400 hover:to-sunshine shadow-tactile hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Get Started Free
        </Button>
      </Link>

      <p className="mt-4 text-sm text-muted-foreground">
        No credit card required
      </p>
    </div>
  )
}
