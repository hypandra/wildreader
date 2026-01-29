"use client"

import Link from "next/link"
import { Star, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChild } from "@/lib/contexts/ChildContext"
import { LearnerSelector } from "@/components/LearnerSelector"

interface MobileNavProps {
  showSettings?: boolean
  showLearnerSelector?: boolean
}

export function MobileNav({ showSettings = true, showLearnerSelector = true }: MobileNavProps) {
  const { session } = useChild()

  return (
    <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-sunshine/10 shadow-sm">
      <div className="flex items-center justify-between px-3 py-2">
        {/* Star counter */}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-sunshine/20 to-amber-100/40 px-2.5 py-1 rounded-xl border border-sunshine/30">
          <Star className="h-4 w-4 fill-sunshine text-sunshine" />
          <span className="text-base font-display font-bold text-bark">
            {session.totalStars}
          </span>
        </div>

        {/* Right side - Learner selector and settings */}
        <div className="flex items-center gap-2">
          {showLearnerSelector && (
            <LearnerSelector buttonClassName="h-8 px-2 text-sm" />
          )}

          {/* Settings button */}
          {showSettings && (
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-coral/10 hover:text-coral transition-all duration-200"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
