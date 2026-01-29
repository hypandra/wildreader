"use client"

export type TargetPosition = {
  x: number
  y: number
  width: number
  height: number
  driftX: number
  driftY: number
  spawnOffsetX: number
  spawnOffsetY: number
  duration: number
  delay: number
}

export type SightWordSelectionStrategy = "weighted" | "random" | "sequential"

export type SightWordSplatterOverrides = {
  rules?: {
    poolSizes?: Partial<Record<"easy" | "medium" | "hard" | "expert", number>>
    selection?: SightWordSelectionStrategy
  }
  ui?: {
    buttonColors?: string[]
    splatScale?: { min: number; max: number }
    background?: { from: string; to: string }
  }
  audio?: {
    instruction?: string
  }
}
