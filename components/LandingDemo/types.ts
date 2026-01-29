export type DemoStepType = "letter-match" | "word-match" | "reward" | "cta"

export type DemoStepState =
  | "question"
  | "answer-correct"
  | "answer-wrong"
  | "retry"
  | "generating"
  | "result"
  | "final"

export type DemoStep = {
  id: string
  type: DemoStepType
  state: DemoStepState
  caption: string
  duration: number
  data?: {
    target?: string
    targetEmoji?: string
    options?: string[]
    correctIndex?: number
    selectedIndex?: number
    rewardImage?: string
    rewardPrompt?: string
  }
}

export type DemoState = {
  currentStepIndex: number
  isPlaying: boolean
  isComplete: boolean
  isVisible: boolean
}
