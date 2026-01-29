import { generateTTS, getTTSModel, type TTSVoice } from "@/lib/audio/generate"
import { checksumForTTSInput } from "@/lib/wr/checksum"
import { uploadClipToCDN, type AudioClipCategory } from "@/lib/wr/storage"

export type TTSProvider = "openai"

export interface TTSRequest {
  text: string
  provider?: TTSProvider
  voice?: TTSVoice
  speed?: number
}

export function checksumForTTS(params: {
  text: string
  provider: string
  voice: string
  speed: number
  model: string
}) {
  return checksumForTTSInput(params)
}

export async function synthesizeClip(
  request: TTSRequest,
  category: AudioClipCategory
): Promise<{ url: string; checksum: string; durationMs: number | null }>{
  const provider = request.provider ?? "openai"
  const voice = request.voice ?? "nova"
  const speed = request.speed ?? 1
  const model = getTTSModel()
  const checksum = checksumForTTS({
    text: request.text,
    provider,
    voice,
    speed,
    model,
  })

  const audioBuffer = await generateTTS(request.text, { voice, speed, model })
  const url = await uploadClipToCDN(audioBuffer, checksum, category)

  return { url, checksum, durationMs: null }
}
