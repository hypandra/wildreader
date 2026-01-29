"use client";

import { useEffect, useState } from "react";
import { useDemoPlayer } from "./hooks/useDemoPlayer";
import { DemoStep } from "./DemoStep";
import { DemoProgress } from "./DemoProgress";
import { DemoCaption } from "./DemoCaption";
import { DemoStaticFallback } from "./DemoStaticFallback";
import { cn } from "@/lib/utils";

export function LandingDemo() {
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    isComplete,
    containerRef,
    advanceStep,
    goToStep,
  } = useDemoPlayer();

  // Detect reduced motion preference (client-side only)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (prefersReducedMotion) {
    return <DemoStaticFallback />;
  }

  return (
    <div className="relative max-w-2xl mx-auto my-4 px-4">
      {/* Demo container */}
      <div
        ref={containerRef}
        onClick={advanceStep}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            advanceStep();
          }
        }}
        aria-label="Click to advance demo"
      >
        {/* Floating card container */}
        <div
          className={cn(
            "relative bg-card/95 backdrop-blur-md",
            "rounded-[2rem] border-2 border-sunshine/30",
            "shadow-soft-lg overflow-hidden",
            "min-h-[360px]",
            "transition-transform duration-200",
            !isComplete && "hover:scale-[1.01] active:scale-[0.99]"
          )}
        >
          <DemoStep step={currentStep} />
          <DemoCaption text={currentStep.caption} />
        </div>

        <DemoProgress
          currentIndex={currentStepIndex}
          total={totalSteps}
          onDotClick={goToStep}
        />

        {/* Hint to click */}
        {!isComplete && (
          <p className="text-center mt-2 text-xs text-muted-foreground animate-pulse">
            Tap to skip ahead
          </p>
        )}
      </div>
    </div>
  );
}
