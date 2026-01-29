import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, getServiceClient } from "@/app/api/_utils"
import { checksumForTTS, synthesizeClip } from "@/lib/wr/tts"
import { getTTSModel, type TTSVoice } from "@/lib/audio/generate"
import type { AudioClipCategory } from "@/lib/wr/storage"

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as {
      text?: string
      ownerType?: "story_segment" | "quiz_question"
      ownerId?: string
      provider?: "openai"
      voice?: TTSVoice
      category?: AudioClipCategory
    }

    const text = body.text?.trim()
    if (!text || !body.ownerType || !body.ownerId) {
      return NextResponse.json({ error: "text, ownerType, ownerId required" }, { status: 400 })
    }

    const provider = body.provider ?? "openai"
    const voice = body.voice ?? "nova"
    const category: AudioClipCategory = body.category ??
      (body.ownerType === "story_segment" ? "story-segment" : "quiz-question")

    const checksum = checksumForTTS({
      text,
      provider,
      voice,
      speed: 1,
      model: getTTSModel(),
    })

    const supabase = getServiceClient()
    const { data: existing, error: existingError } = await supabase
      .from("wr_audio_clips")
      .select("id, url, duration_ms, checksum")
      .eq("checksum", checksum)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ clip: existing })
    }

    const clip = await synthesizeClip({ text, provider, voice, speed: 1 }, category)

    const { data: inserted, error: insertError } = await supabase
      .from("wr_audio_clips")
      .insert({
        owner_type: body.ownerType,
        owner_id: body.ownerId,
        provider,
        voice,
        url: clip.url,
        duration_ms: clip.durationMs,
        checksum: clip.checksum,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ clip: inserted })
  } catch (error) {
    console.error("[AudioClip] POST error:", error)
    return NextResponse.json({ error: "Failed to generate audio clip" }, { status: 500 })
  }
}
