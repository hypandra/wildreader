export type AudioClipCategory = "story-segment" | "quiz-question"

function getStorageConfig() {
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const storagePassword = process.env.BUNNY_STORAGE_PASSWORD
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME

  if (!storageZone || !storagePassword || !cdnHostname) {
    throw new Error("BunnyCDN configuration missing")
  }

  return { storageZone, storagePassword, cdnHostname }
}

function getStorageHost() {
  const storageRegion = process.env.BUNNY_STORAGE_REGION || "la"
  return storageRegion === "default"
    ? "storage.bunnycdn.com"
    : `${storageRegion}.storage.bunnycdn.com`
}

export function getClipPath(checksum: string, category: AudioClipCategory) {
  return `audio/quizzes/${category}/${checksum}.mp3`
}

export function getClipUrl(checksum: string, category: AudioClipCategory) {
  const { cdnHostname } = getStorageConfig()
  const path = getClipPath(checksum, category)
  return `https://${cdnHostname}/${path}`
}

export async function uploadClipToCDN(
  buffer: Buffer,
  checksum: string,
  category: AudioClipCategory
): Promise<string> {
  const { storageZone, storagePassword, cdnHostname } = getStorageConfig()
  const path = getClipPath(checksum, category)
  const uploadUrl = `https://${getStorageHost()}/${storageZone}/${path}`

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: storagePassword,
      "Content-Type": "audio/mpeg",
    },
    body: buffer as unknown as BodyInit,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`BunnyCDN upload failed: ${response.status} ${errorText}`)
  }

  return `https://${cdnHostname}/${path}`
}
