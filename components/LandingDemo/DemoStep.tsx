"use client"

import { DemoLetterMatch } from "./DemoLetterMatch"
import { DemoWordMatch } from "./DemoWordMatch"
import { DemoReward } from "./DemoReward"
import { DemoCTA } from "./DemoCTA"
import type { DemoStep as DemoStepType } from "./types"

type DemoStepProps = {
  step: DemoStepType
}

export function DemoStep({ step }: DemoStepProps) {
  switch (step.type) {
    case "letter-match":
      return <DemoLetterMatch step={step} />
    case "word-match":
      return <DemoWordMatch step={step} />
    case "reward":
      return <DemoReward step={step} />
    case "cta":
      return <DemoCTA />
    default:
      return null
  }
}
