/**
 * BunnyCDN Storage API helper for uploading images
 * Docs: https://docs.bunny.net/reference/storage-api
 */

/**
 * Convert base64 data URL to Buffer
 */
function base64ToBuffer(base64Data: string): Buffer {
  // Handle both data URLs and plain base64
  const base64String = base64Data.includes(',')
    ? base64Data.split(',')[1]
    : base64Data

  return Buffer.from(base64String, 'base64')
}

/**
 * Upload image to BunnyCDN Storage
 * Returns the CDN URL of the uploaded image
 */
export async function uploadImageToBunny(
  base64Image: string,
  filename: string
): Promise<string> {
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const storagePassword = process.env.BUNNY_STORAGE_PASSWORD
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME

  if (!storageZone || !storagePassword || !cdnHostname) {
    throw new Error('BunnyCDN configuration missing. Add BUNNY_STORAGE_ZONE, BUNNY_STORAGE_PASSWORD, and BUNNY_CDN_HOSTNAME to .env.local')
  }

  // Convert base64 to buffer
  const imageBuffer = base64ToBuffer(base64Image)

  // Upload to BunnyCDN Storage API (LA region)
  const storageRegion = process.env.BUNNY_STORAGE_REGION || 'la'
  const storageHost = storageRegion === 'default' ? 'storage.bunnycdn.com' : `${storageRegion}.storage.bunnycdn.com`
  const uploadUrl = `https://${storageHost}/${storageZone}/rewards/${filename}`

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'AccessKey': storagePassword,
      'Content-Type': 'image/png',
    },
    body: imageBuffer as any,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`BunnyCDN upload failed: ${response.status} ${errorText}`)
  }

  // Return the CDN URL
  return `https://${cdnHostname}/rewards/${filename}`
}

/**
 * Delete image from BunnyCDN Storage
 */
export async function deleteImageFromBunny(filename: string): Promise<void> {
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const storagePassword = process.env.BUNNY_STORAGE_PASSWORD

  if (!storageZone || !storagePassword) {
    throw new Error('BunnyCDN configuration missing')
  }

  const storageRegion = process.env.BUNNY_STORAGE_REGION || 'la'
  const storageHost = storageRegion === 'default' ? 'storage.bunnycdn.com' : `${storageRegion}.storage.bunnycdn.com`
  const deleteUrl = `https://${storageHost}/${storageZone}/rewards/${filename}`

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'AccessKey': storagePassword,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`BunnyCDN delete failed: ${response.status} ${errorText}`)
  }
}
