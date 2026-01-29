export interface StorySegmentDraft {
  segmentText: string
  pauseMs: number
}

const DEFAULT_MIN_PAUSE_MS = 700
const DEFAULT_MAX_PAUSE_MS = 1100

function splitIntoSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (!cleaned) return []

  const matches = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g)
  if (!matches) return []

  return matches.map((sentence) => sentence.trim()).filter(Boolean)
}

function pauseForIndex(index: number, minPauseMs: number, maxPauseMs: number) {
  if (maxPauseMs <= minPauseMs) return minPauseMs
  const range = maxPauseMs - minPauseMs
  return minPauseMs + ((index * 137) % (range + 1))
}

export function segmentStory(
  text: string,
  options?: {
    sentencesPerSegment?: number
    minPauseMs?: number
    maxPauseMs?: number
  }
): StorySegmentDraft[] {
  const sentences = splitIntoSentences(text)
  if (sentences.length === 0) return []

  const sentencesPerSegment = Math.max(1, options?.sentencesPerSegment ?? 2)
  const minPauseMs = options?.minPauseMs ?? DEFAULT_MIN_PAUSE_MS
  const maxPauseMs = options?.maxPauseMs ?? DEFAULT_MAX_PAUSE_MS

  const segments: StorySegmentDraft[] = []
  for (let i = 0; i < sentences.length; i += sentencesPerSegment) {
    const chunk = sentences.slice(i, i + sentencesPerSegment).join(" ")
    const pauseMs = pauseForIndex(segments.length, minPauseMs, maxPauseMs)
    segments.push({ segmentText: chunk, pauseMs })
  }

  return segments
}
