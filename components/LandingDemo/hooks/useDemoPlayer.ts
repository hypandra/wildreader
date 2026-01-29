"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { DEMO_STEPS } from "../demo-steps"
import type { DemoState } from "../types"

export function useDemoPlayer() {
  const [state, setState] = useState<DemoState>({
    currentStepIndex: 0,
    isPlaying: true,
    isComplete: false,
    isVisible: true,
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Auto-advance timer
  useEffect(() => {
    if (!state.isPlaying || state.isComplete || !state.isVisible) return

    const currentStep = DEMO_STEPS[state.currentStepIndex]
    if (!currentStep || currentStep.duration === Infinity) return

    timerRef.current = setTimeout(() => {
      if (state.currentStepIndex < DEMO_STEPS.length - 1) {
        setState((prev) => ({
          ...prev,
          currentStepIndex: prev.currentStepIndex + 1,
        }))
      } else {
        setState((prev) => ({ ...prev, isComplete: true, isPlaying: false }))
      }
    }, currentStep.duration)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state.currentStepIndex, state.isPlaying, state.isComplete, state.isVisible])

  // Intersection Observer for pause-when-hidden
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setState((prev) => ({
          ...prev,
          isVisible: entry.isIntersecting,
          isPlaying: entry.isIntersecting && !prev.isComplete,
        }))
      },
      { threshold: 0.5 }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  const advanceStep = useCallback(() => {
    if (state.isComplete) return

    if (timerRef.current) clearTimeout(timerRef.current)

    if (state.currentStepIndex < DEMO_STEPS.length - 1) {
      setState((prev) => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex + 1,
      }))
    } else {
      setState((prev) => ({ ...prev, isComplete: true, isPlaying: false }))
    }
  }, [state.currentStepIndex, state.isComplete])

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= DEMO_STEPS.length) return

    if (timerRef.current) clearTimeout(timerRef.current)

    setState((prev) => ({
      ...prev,
      currentStepIndex: index,
      isComplete: index === DEMO_STEPS.length - 1,
      isPlaying: index < DEMO_STEPS.length - 1,
    }))
  }, [])

  return {
    currentStep: DEMO_STEPS[state.currentStepIndex],
    currentStepIndex: state.currentStepIndex,
    totalSteps: DEMO_STEPS.length,
    isComplete: state.isComplete,
    containerRef,
    advanceStep,
    goToStep,
  }
}
