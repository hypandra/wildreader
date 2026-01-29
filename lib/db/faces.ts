import type { Face } from "@/types"

export async function getFaceLibrary(): Promise<Face[]> {
  const response = await fetch("/api/faces")
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || "Failed to load faces")
  }

  const payload = (await response.json()) as { faces?: any[] }
  const data = payload.faces || []

  return data.map((face) => ({
    id: face.id,
    name: face.name,
    imagePath: face.imagePath,
    imageUrl: face.imageUrl,
  }))
}

export async function updateFace(
  faceId: string,
  updates: { name?: string; photo?: File | null }
): Promise<Face> {
  const formData = new FormData()
  if (updates.name !== undefined) {
    formData.append("name", updates.name)
  }
  if (updates.photo) {
    formData.append("photo", updates.photo)
  }

  const response = await fetch(`/api/faces/${faceId}`, {
    method: "PATCH",
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || "Failed to update face")
  }

  const payload = (await response.json()) as { face: any }
  const face = payload.face

  return {
    id: face.id,
    name: face.name,
    imagePath: face.imagePath,
    imageUrl: face.imageUrl,
  }
}

export async function deleteFace(faceId: string): Promise<void> {
  const response = await fetch(`/api/faces/${faceId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || "Failed to delete face")
  }
}
