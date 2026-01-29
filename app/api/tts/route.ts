/**
 * TTS API endpoint
 * Generates audio using OpenAI TTS with multi-layer caching
 */

import { NextRequest, NextResponse } from "next/server"
import { generateTTS, getTTSModel, type TTSVoice } from "@/lib/audio/generate"
import { getCachedAudio, setCachedAudio } from "@/lib/audio/cache"
import {
  fetchAudioFromCDN,
  uploadAudioToCDN,
} from "@/lib/audio/storage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = body.text as string
    const voice = (body.voice as TTSVoice) || "nova"
    const speed = (body.speed as number) || 1.0
    const category = body.category === "words" ? "words" : "phrases"
    const model = getTTSModel()

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 })
    }

    // 1. Check server-side cache (Redis)
    const cached = await getCachedAudio(text, voice, speed, model, category)
    if (cached) {
      const buffer = Buffer.from(cached, "base64")
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "audio/mpeg",
          "X-TTS-Model": model,
          "X-Cache": "HIT-REDIS",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }

    // 2. Check BunnyCDN for cached audio
    const cdnBuffer = await fetchAudioFromCDN(text, voice, speed, category)
    if (cdnBuffer) {
      // Cache in Redis for faster future access
      await setCachedAudio(text, voice, speed, model, category, cdnBuffer.toString("base64"))

      return new NextResponse(new Uint8Array(cdnBuffer), {
        headers: {
          "Content-Type": "audio/mpeg",
          "X-TTS-Model": model,
          "X-Cache": "HIT-CDN",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }

    // 3. Generate via OpenAI TTS
    const audioBuffer = await generateTTS(text, { voice, speed, model })
    const base64 = audioBuffer.toString("base64")

    // 4. Upload to CDN for future requests (async, don't block response)
    uploadAudioToCDN(text, voice, speed, audioBuffer, category).catch((error) => {
      console.error("CDN upload failed:", error)
    })

    // 5. Cache in Redis
    await setCachedAudio(text, voice, speed, model, category, base64)

    // 6. Return audio
    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-TTS-Model": model,
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("TTS generation error:", error)
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 }
    )
  }
}
