/**
 * Server-side Redis caching for TTS audio
 * Supports both Upstash Redis and Vercel KV
 * Gracefully falls back if not configured
 */

import { Redis } from "@upstash/redis"

// Initialize Redis client if configured
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : process.env.KV_REST_API_URL
  ? Redis.fromEnv()
  : null

// Cache TTL: 7 days
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7

// Max size for cached audio: 500KB base64 (~375KB MP3)
const MAX_CACHE_SIZE = 500_000

/**
 * Generate a cache key for TTS audio
 */
function getCacheKey(
  text: string,
  voice: string,
  speed: number,
  model: string,
  category: string
): string {
  const normalizedText = text.toLowerCase().trim()
  return `tts:v2:${model}:${voice}:${speed}:${category}:${normalizedText}`
}

/**
 * Check if Redis caching is available
 */
export function isCacheAvailable(): boolean {
  return redis !== null
}

/**
 * Get cached audio from Redis
 * Returns base64-encoded MP3 or null if not cached
 */
export async function getCachedAudio(
  text: string,
  voice: string,
  speed: number,
  model: string,
  category: string
): Promise<string | null> {
  if (!redis) return null

  const key = getCacheKey(text, voice, speed, model, category)

  try {
    const cached = await redis.get<string>(key)
    return cached
  } catch (error) {
    console.warn("Redis cache get failed:", error)
    return null
  }
}

/**
 * Store audio in Redis cache
 */
export async function setCachedAudio(
  text: string,
  voice: string,
  speed: number,
  model: string,
  category: string,
  audioBase64: string
): Promise<void> {
  if (!redis) return

  // Skip if audio is too large
  if (audioBase64.length > MAX_CACHE_SIZE) {
    console.warn(`Audio too large to cache: ${audioBase64.length} bytes`)
    return
  }

  const key = getCacheKey(text, voice, speed, model, category)

  try {
    await redis.set(key, audioBase64, { ex: CACHE_TTL_SECONDS })
  } catch (error) {
    console.warn("Redis cache set failed:", error)
  }
}
