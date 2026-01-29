/**
 * OpenAI TTS generation wrapper
 */

import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type TTSVoice = "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer"
export type TTSModel = "tts-1" | "tts-1-hd"

export interface TTSOptions {
  voice?: TTSVoice
  speed?: number // 0.25 to 4.0
  model?: TTSModel
}

/**
 * Generate audio from text using OpenAI TTS API
 * Returns MP3 audio as a Buffer
 */
export async function generateTTS(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  const model = options.model || (process.env.OPENAI_TTS_MODEL as TTSModel) || "tts-1"
  const voice = options.voice || "nova"
  const speed = options.speed || 1.0

  const response = await openai.audio.speech.create({
    model,
    voice,
    input: text,
    speed,
    response_format: "mp3",
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  return buffer
}

/**
 * Get the current TTS model being used
 */
export function getTTSModel(): TTSModel {
  return (process.env.OPENAI_TTS_MODEL as TTSModel) || "tts-1"
}
