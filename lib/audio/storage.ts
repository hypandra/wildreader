/**
 * BunnyCDN storage for pre-generated TTS audio files
 */

/**
 * Generate a CDN-safe filename from text
 */
type AudioCategory = "phrases" | "words"

function getAudioFilename(
  text: string,
  voice: string,
  speed: number,
  category: AudioCategory
): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
  return `audio/${category}/${voice}-${speed}-${slug}.mp3`
}

/**
 * Get the CDN URL for an audio file
 */
export function getAudioCDNUrl(
  text: string,
  voice: string,
  speed: number,
  category: AudioCategory = "phrases"
): string {
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME
  if (!cdnHostname) {
    throw new Error("BUNNY_CDN_HOSTNAME not configured")
  }

  const filename = getAudioFilename(text, voice, speed, category)
  return `https://${cdnHostname}/${filename}`
}

/**
 * Upload audio file to BunnyCDN
 */
export async function uploadAudioToCDN(
  text: string,
  voice: string,
  speed: number,
  audioBuffer: Buffer,
  category: AudioCategory = "phrases"
): Promise<string> {
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const storagePassword = process.env.BUNNY_STORAGE_PASSWORD
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME

  if (!storageZone || !storagePassword || !cdnHostname) {
    throw new Error("BunnyCDN configuration missing")
  }

  const filename = getAudioFilename(text, voice, speed, category)
  const storageRegion = process.env.BUNNY_STORAGE_REGION || "la"
  const storageHost =
    storageRegion === "default"
      ? "storage.bunnycdn.com"
      : `${storageRegion}.storage.bunnycdn.com`
  const uploadUrl = `https://${storageHost}/${storageZone}/${filename}`

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: storagePassword,
      "Content-Type": "audio/mpeg",
    },
    body: audioBuffer as unknown as BodyInit,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`BunnyCDN upload failed: ${response.status} ${errorText}`)
  }

  return `https://${cdnHostname}/${filename}`
}

/**
 * Check if audio exists on CDN
 */
export async function audioExistsOnCDN(
  text: string,
  voice: string,
  speed: number,
  category: AudioCategory = "phrases"
): Promise<boolean> {
  try {
    const url = getAudioCDNUrl(text, voice, speed, category)
    const response = await fetch(url, { method: "HEAD" })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Fetch audio from CDN
 * Returns Buffer or null if not found
 */
export async function fetchAudioFromCDN(
  text: string,
  voice: string,
  speed: number,
  category: AudioCategory = "phrases"
): Promise<Buffer | null> {
  try {
    const url = getAudioCDNUrl(text, voice, speed, category)
    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    return buffer
  } catch {
    return null
  }
}

/**
 * Patterns for content that should be pre-generated
 */
const PRE_GEN_PATTERNS = [
  /^[a-zA-Z]$/, // Single letters
  /^find the lowercase letter/i,
  /^tap all the/i,
  /^which picture starts/i,
  /^which letter does/i,
  /^find the words that/i,
  /^find the picture for/i,
  /^find the word for/i,
  /^who is this person/i,
  /^how many words/i,
  // Feedback phrases
  /^great job!?$/i,
  /^you got it!?$/i,
  /^excellent!?$/i,
  /^perfect!?$/i,
  /^way to go!?$/i,
  /^awesome!?$/i,
  /^you're doing great!?$/i,
  /^nice work!?$/i,
  /^that's right!?$/i,
  /^wonderful!?$/i,
  /^no$/i,
  /^not quite$/i,
  /^incorrect$/i,
  // Hints
  /^look for the same shape/i,
  /^keep looking/i,
  /^think about the sound/i,
  /^listen to the first sound/i,
  /^listen to the beginning/i,
  /^listen to the ending/i,
  /^say the word for/i,
  /^think about what this word/i,
  /^look at their face/i,
  /^try again/i,
]

/**
 * Check if content should be pre-generated and stored on CDN
 */
export function isPreGeneratedContent(text: string): boolean {
  return PRE_GEN_PATTERNS.some((pattern) => pattern.test(text))
}
