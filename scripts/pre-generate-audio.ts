#!/usr/bin/env bun
/**
 * Pre-generate TTS audio files and upload to BunnyCDN
 *
 * Usage:
 *   bun run scripts/pre-generate-audio.ts
 *
 * Environment variables required:
 *   - OPENAI_API_KEY
 *   - BUNNY_STORAGE_ZONE
 *   - BUNNY_STORAGE_PASSWORD
 *   - BUNNY_CDN_HOSTNAME
 */

import "dotenv/config"
import OpenAI from "openai"

// Validate environment
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is required")
  process.exit(1)
}
if (!process.env.BUNNY_STORAGE_ZONE || !process.env.BUNNY_STORAGE_PASSWORD) {
  console.error("❌ BunnyCDN configuration is required")
  process.exit(1)
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Configuration
const VOICE = "nova"
const MODEL = (process.env.OPENAI_TTS_MODEL as "tts-1" | "tts-1-hd") || "tts-1"
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD
const CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME
const STORAGE_REGION = process.env.BUNNY_STORAGE_REGION || "la"

// Content to pre-generate
const GAME_INSTRUCTION_TEMPLATES = [
  "Find the lowercase letter",
  "Tap all the letters",
  "Which picture starts with",
  "Which letter does start with",
  "Find the words that start like",
  "Find the words that end like",
  "Find the picture for",
  "Find the word for this picture",
  "Who is this person",
  "How many words can you think of",
]

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

const INCORRECT_PHRASES = ["No", "Not quite", "Incorrect"]

const HINT_TEMPLATES = [
  "Look for the same shape, just smaller",
  "Keep looking! Some letters look similar",
  "Think about the sound this letter makes",
  "Listen to the first sound in the word",
  "Listen to the beginning sound",
  "Listen to the ending sound",
  "Say the word for the picture out loud",
  "Think about what this word means",
  "Look at their face carefully",
  "Try again! You can do it",
]

/**
 * Generate audio using OpenAI TTS
 */
async function generateTTS(
  text: string,
  speed: number = 1.0
): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: MODEL,
    voice: VOICE,
    input: text,
    speed,
    response_format: "mp3",
  })

  return Buffer.from(await response.arrayBuffer())
}

/**
 * Generate a CDN-safe filename from text
 */
function getFilename(text: string, speed: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
  return `audio/${VOICE}-${speed}-${slug}.mp3`
}

/**
 * Upload audio file to BunnyCDN
 */
async function uploadToCDN(
  text: string,
  speed: number,
  audioBuffer: Buffer
): Promise<string> {
  const filename = getFilename(text, speed)
  const storageHost =
    STORAGE_REGION === "default"
      ? "storage.bunnycdn.com"
      : `${STORAGE_REGION}.storage.bunnycdn.com`
  const uploadUrl = `https://${storageHost}/${STORAGE_ZONE}/${filename}`

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: STORAGE_PASSWORD!,
      "Content-Type": "audio/mpeg",
    },
    body: new Uint8Array(audioBuffer),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Upload failed: ${response.status} ${errorText}`)
  }

  return `https://${CDN_HOSTNAME}/${filename}`
}

/**
 * Generate and upload a single audio file
 */
async function processItem(
  text: string,
  speed: number,
  index: number,
  total: number
): Promise<void> {
  const filename = getFilename(text, speed)
  process.stdout.write(`[${index + 1}/${total}] ${text.slice(0, 30)}...`)

  try {
    const buffer = await generateTTS(text, speed)
    const url = await uploadToCDN(text, speed, buffer)
    console.log(` ✅ ${(buffer.length / 1024).toFixed(1)}KB`)
  } catch (error) {
    console.log(` ❌ ${error}`)
  }

  // Rate limiting: small delay between API calls
  await new Promise((resolve) => setTimeout(resolve, 100))
}

/**
 * Main pre-generation function
 */
async function main() {
  console.log("🎵 Wild Reader TTS Pre-Generation")
  console.log("================================")
  console.log(`Model: ${MODEL}`)
  console.log(`Voice: ${VOICE}`)
  console.log(`Storage: ${STORAGE_ZONE}`)
  console.log("")

  // Build content list
  const items: { text: string; speed: number }[] = []

  // Letters (a-z, A-Z)
  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    items.push({ text: letter, speed: 1.0 })
    items.push({ text: letter.toUpperCase(), speed: 1.0 })
  }

  // Game instruction templates
  for (const template of GAME_INSTRUCTION_TEMPLATES) {
    items.push({ text: template, speed: 1.0 })
  }

  // Feedback phrases
  for (const phrase of CORRECT_PHRASES) {
    items.push({ text: phrase, speed: 1.0 })
  }
  for (const phrase of INCORRECT_PHRASES) {
    items.push({ text: phrase, speed: 1.0 })
  }

  // Hint templates (slower speed)
  for (const hint of HINT_TEMPLATES) {
    items.push({ text: hint, speed: 0.85 })
  }

  console.log(`Total items to generate: ${items.length}`)
  console.log("")

  // Process all items
  let successCount = 0
  let errorCount = 0
  const startTime = Date.now()

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    try {
      await processItem(item.text, item.speed, i, items.length)
      successCount++
    } catch (error) {
      console.error(`Error processing "${item.text}":`, error)
      errorCount++
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log("")
  console.log("================================")
  console.log(`✅ Generated: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`⏱️  Time: ${elapsed}s`)
  console.log("")

  // Estimate costs
  const totalChars = items.reduce((sum, item) => sum + item.text.length, 0)
  const costPerMillion = MODEL === "tts-1-hd" ? 30 : 15
  const estimatedCost = (totalChars / 1_000_000) * costPerMillion
  console.log(`📊 Total characters: ${totalChars}`)
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`)
}

main().catch(console.error)
