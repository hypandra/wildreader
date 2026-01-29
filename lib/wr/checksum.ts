import { createHash } from "crypto"

export function checksumForText(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex")
}

export function checksumForTTSInput(params: {
  text: string
  provider: string
  voice: string
  speed: number
  model: string
}): string {
  const normalized = {
    text: params.text.trim(),
    provider: params.provider,
    voice: params.voice,
    speed: params.speed,
    model: params.model,
  }

  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex")
}
