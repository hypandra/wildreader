/**
 * Audio utilities for text-to-speech using OpenAI TTS API
 * Replaces Web Speech API for consistent, high-quality audio
 */

import type { GameType } from "@/types"

// Re-export content for backwards compatibility
export {
  CORRECT_PHRASES,
  INCORRECT_PHRASES,
  HINT_TEMPLATES,
} from "./audio/content"

// Browser Cache API integration
const CACHE_NAME = "wildreader-tts-v1"
const MODEL_CACHE_KEY = "wildreader-tts-model"
const MODEL_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get cached TTS model version from localStorage
 */
async function getCachedModel(): Promise<string | null> {
  if (typeof window === "undefined") return null

  try {
    const cached = localStorage.getItem(MODEL_CACHE_KEY)
    if (!cached) return null

    const { model, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > MODEL_CACHE_TTL) {
      localStorage.removeItem(MODEL_CACHE_KEY)
      return null
    }
    return model
  } catch {
    return null
  }
}

/**
 * Store TTS model version in localStorage
 */
async function setCachedModel(model: string): Promise<void> {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(
      MODEL_CACHE_KEY,
      JSON.stringify({
        model,
        timestamp: Date.now(),
      })
    )
  } catch {}
}

/**
 * Get cached audio from Browser Cache API
 */
async function getCachedAudio(
  text: string,
  voice: string,
  speed: number,
  category: string
): Promise<Response | null> {
  if (typeof window === "undefined") return null

  try {
    const cache = await caches.open(CACHE_NAME)
    const cacheKey = `/__tts_cache?text=${encodeURIComponent(text)}&voice=${voice}&speed=${speed}&category=${category}`
    const response = await cache.match(cacheKey)
    return response ?? null
  } catch {
    return null
  }
}

/**
 * Store audio in Browser Cache API
 */
async function setCachedAudio(
  text: string,
  voice: string,
  speed: number,
  category: string,
  response: Response
): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const cache = await caches.open(CACHE_NAME)
    const cacheKey = `/__tts_cache?text=${encodeURIComponent(text)}&voice=${voice}&speed=${speed}&category=${category}`
    await cache.put(cacheKey, response)
  } catch {}
}

/**
 * Fetch audio from TTS API with browser caching
 */
export async function fetchAudioBlob(
  text: string,
  options: {
    voice?: string
    speed?: number
    category?: "phrases" | "words"
  } = {}
): Promise<Blob> {
  const voice = options.voice || "nova"
  const speed = options.speed || 1.0
  const category = options.category || "phrases"

  // Check browser cache first
  const cached = await getCachedAudio(text, voice, speed, category)
  if (cached) {
    return await cached.clone().blob()
  }

  // Fetch from API
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, speed, category }),
  })

  if (!response.ok) {
    throw new Error("TTS generation failed")
  }

  // Check model version and invalidate cache if changed
  const newModel = response.headers.get("X-TTS-Model")
  if (newModel) {
    const cachedModel = await getCachedModel()
    if (cachedModel && cachedModel !== newModel) {
      // Model changed, invalidate entire cache
      if (typeof window !== "undefined") {
        await caches.delete(CACHE_NAME)
      }
    }
    await setCachedModel(newModel)
  }

  // Cache the response
  const responseClone = response.clone()
  await setCachedAudio(text, voice, speed, category, responseClone)

  return await response.blob()
}

/**
 * Speak text using OpenAI TTS
 */
export async function speak(
  text: string,
  options: {
    rate?: number
    pitch?: number // Ignored (OpenAI doesn't support pitch)
    volume?: number // Ignored (browser handles volume)
    voice?: string
    category?: "phrases" | "words"
    onEnd?: () => void
  } = {}
): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const speed = options.rate || 1.0
    const blob = await fetchAudioBlob(text, {
      speed,
      voice: options.voice,
      category: options.category,
    })
    const url = URL.createObjectURL(blob)

    const audio = new Audio(url)

    if (options.onEnd) {
      audio.addEventListener("ended", options.onEnd)
    }

    // Cleanup blob URL after playback
    audio.addEventListener("ended", () => {
      URL.revokeObjectURL(url)
    })

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url)
    })

    await audio.play()
  } catch (error) {
    console.error("Audio playback failed:", error)
    options.onEnd?.()
  }
}

function playBlobAndWait(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    const cleanup = () => {
      URL.revokeObjectURL(url)
      resolve()
    }

    audio.addEventListener("ended", cleanup, { once: true })
    audio.addEventListener("error", cleanup, { once: true })

    audio.play().catch(() => cleanup())
  })
}

export async function speakSequence(
  parts: Array<{
    text: string
    rate?: number
    voice?: string
    category?: "phrases" | "words"
  }>
): Promise<void> {
  if (typeof window === "undefined") return

  for (const part of parts) {
    const blob = await fetchAudioBlob(part.text, {
      speed: part.rate,
      voice: part.voice,
      category: part.category,
    })
    await playBlobAndWait(blob)
  }
}

export async function prefetchSpeech(
  parts: Array<{
    text: string
    rate?: number
    voice?: string
    category?: "phrases" | "words"
  }>
): Promise<void> {
  if (typeof window === "undefined") return

  await Promise.all(
    parts.map((part) =>
      fetchAudioBlob(part.text, {
        speed: part.rate,
        voice: part.voice,
        category: part.category,
      }).catch(() => null)
    )
  )
}

/**
 * Stop any ongoing speech
 * Note: This doesn't actually stop OpenAI TTS playback (would need audio element tracking)
 */
export function stopSpeaking(): void {
  // No-op for OpenAI TTS
  // Individual audio elements handle their own lifecycle
}

// Game instruction templates
export function getGameInstruction(
  gameType: GameType,
  questionText: string
): string {
  switch (gameType) {
    case "letter-match":
      return `Find the lowercase letter ${questionText}`
    case "letter-hunt":
      return `Tap all the ${questionText} letters`
    case "letter-to-picture":
      return `Which picture starts with ${questionText}?`
    case "picture-to-letter":
      return `Which letter does ${questionText} start with?`
    case "starts-with":
      return `Find the words that start like ${questionText}`
    case "ends-with":
      return `Find the words that end like ${questionText}`
    case "word-match":
      return `Find the picture for ${questionText}`
    case "sight-word-splatter":
      return `Click ${questionText} to make it splat`
    case "picture-match":
      return `Find the word for this picture`
    case "face-match":
      return `Who is this person?`
    case "name-to-face":
      return `Read the name. Click their face.`
    case "todays-sound":
      return `Today's sound is ${questionText}. How many words can you think of?`
    default:
      return "Choose the correct answer"
  }
}

// Encouragement phrases for correct answers
const CORRECT_PHRASES = [
  "Great job!",
  "You got it!",
  "Excellent!",
  "Perfect!",
  "Way to go!",
  "Awesome!",
  "You're doing great!",
  "Nice work!",
  "That's right!",
  "Wonderful!",
]

// Simple, neutral phrases for incorrect answers
const INCORRECT_PHRASES = ["No", "Not quite", "Incorrect"]

// Get random encouragement phrase
export function getCorrectPhrase(): string {
  return CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)]
}

// Get random redirect phrase
export function getIncorrectPhrase(): string {
  return INCORRECT_PHRASES[Math.floor(Math.random() * INCORRECT_PHRASES.length)]
}

// Speak game instruction
export function speakGameInstruction(
  gameType: GameType,
  questionText: string
): void {
  const instruction = getGameInstruction(gameType, questionText)
  speak(instruction)
}

// Speak answer option (letter or word)
export function speakAnswerOption(text: string): void {
  speak(text, { rate: 0.8 }) // Slower for clarity
}

// Speak feedback for correct answer
export function speakCorrectFeedback(phrase?: string): void {
  const text = phrase || getCorrectPhrase()
  speak(text, { rate: 1.0 })
}

// Speak feedback for incorrect answer
export function speakIncorrectFeedback(): void {
  const phrase = getIncorrectPhrase()
  speak(phrase, { rate: 0.9 })
}

// Game hint templates for wrong answers
export function getGameHint(
  gameType: GameType,
  context: { target?: string; correctAnswer?: string } = {}
): string {
  switch (gameType) {
    case "letter-match":
      return context.target
        ? `Look for the small ${context.target}. It has the same shape!`
        : "Look for the same shape, just smaller"
    case "letter-hunt":
      return "Keep looking! Some letters look similar. Try again"
    case "letter-to-picture":
      return context.target
        ? `Say the ${context.target} sound. Which picture starts with that sound?`
        : "Think about the sound this letter makes"
    case "picture-to-letter":
      return context.target
        ? `${context.target} starts with the ${context.target.charAt(0)} sound`
        : "Listen to the first sound in the word"
    case "starts-with":
      return context.target
        ? `Listen to how ${context.target} starts`
        : "Listen to the beginning sound"
    case "ends-with":
      return context.target
        ? `Listen to how ${context.target} ends`
        : "Listen to the ending sound"
    case "word-match":
      return "Say the word for the picture out loud. Then find it"
    case "sight-word-splatter":
      return context.target && context.correctAnswer
        ? `Sorry, that word is ${context.target}. Please click ${context.correctAnswer} to make it splat.`
        : context.correctAnswer
        ? `Sorry. Please click ${context.correctAnswer} to make it splat.`
        : "Sorry. Please click the word to make it splat."
    case "picture-match":
      return context.target
        ? `What does ${context.target} look like?`
        : "Think about what this word means"
    case "face-match":
      return "Look at their face carefully. Who does it remind you of?"
    case "name-to-face":
      return context.target
        ? `Look for ${context.target}. Which face is theirs?`
        : "Look at each face carefully. Who matches this name?"
    default:
      return "Try again! You can do it"
  }
}

// Speak hint after wrong answer
export function speakHint(
  gameType: GameType,
  context: { target?: string; correctAnswer?: string } = {}
): void {
  const hint = getGameHint(gameType, context)
  // Short delay before speaking hint
  setTimeout(() => {
    speak(hint, { rate: 0.85 }) // Slower, gentle tone for hints
  }, 500)
}

// Legacy compatibility exports
export function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== "undefined"
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return [] // OpenAI TTS uses fixed voices
}

export function getChildFriendlyVoice(): SpeechSynthesisVoice | null {
  return null // OpenAI TTS uses "nova" voice
}
