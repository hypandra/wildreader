import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, getServiceClient } from "@/app/api/_utils"

const SIGNED_URL_EXPIRY = 3600

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ faceId: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { faceId } = await params
    const formData = await request.formData()
    const name = formData.get("name")?.toString()?.trim()
    const photo = formData.get("photo") as File | null

    if (name && name.length > 50) {
      return NextResponse.json({ error: "Name must be 50 characters or less" }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data: face, error: faceError } = await supabase
      .from("wr_faces")
      .select("id, name, image_path")
      .eq("id", faceId)
      .eq("user_id", user.id)
      .single()

    if (faceError || !face) {
      return NextResponse.json({ error: "Face not found" }, { status: 404 })
    }

    let nextImagePath = face.image_path as string | null
    if (photo && photo.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
      if (!allowedTypes.includes(photo.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Please upload a JPEG, PNG, or WebP image." },
          { status: 400 }
        )
      }

      const maxSize = 5 * 1024 * 1024
      if (photo.size > maxSize) {
        return NextResponse.json(
          { error: "Image too large. Maximum size is 5MB." },
          { status: 400 }
        )
      }

      const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg"
      const filename = `${user.id}/${crypto.randomUUID()}.${ext}`
      const buffer = Buffer.from(await photo.arrayBuffer())
      const { error: uploadError } = await supabase.storage
        .from("people-photos")
        .upload(filename, buffer, {
          contentType: photo.type,
          upsert: false,
        })

      if (uploadError) {
        console.error("[Faces] Upload error:", uploadError)
        return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
      }

      nextImagePath = filename
    }

    const { data: updated, error: updateError } = await supabase
      .from("wr_faces")
      .update({
        name: name ?? face.name,
        image_path: nextImagePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", face.id)
      .select("id, name, image_path")
      .single()

    if (updateError || !updated) {
      if (nextImagePath && nextImagePath !== face.image_path) {
        await supabase.storage.from("people-photos").remove([nextImagePath])
      }
      return NextResponse.json({ error: updateError?.message || "Failed to update face" }, { status: 500 })
    }

    if (nextImagePath && nextImagePath !== face.image_path && face.image_path) {
      await supabase.storage.from("people-photos").remove([face.image_path])
    }

    let imageUrl: string | undefined
    if (updated.image_path) {
      const { data: signedData } = await supabase.storage
        .from("people-photos")
        .createSignedUrl(updated.image_path, SIGNED_URL_EXPIRY)
      imageUrl = signedData?.signedUrl
    }

    return NextResponse.json({
      face: {
        id: updated.id,
        name: updated.name,
        imagePath: updated.image_path,
        imageUrl,
      },
    })
  } catch (error) {
    console.error("[Faces] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update face" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ faceId: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { faceId } = await params
    const supabase = getServiceClient()
    const { data: face, error: faceError } = await supabase
      .from("wr_faces")
      .select("id, image_path")
      .eq("id", faceId)
      .eq("user_id", user.id)
      .single()

    if (faceError || !face) {
      return NextResponse.json({ error: "Face not found" }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from("wr_faces")
      .delete()
      .eq("id", face.id)
      .eq("user_id", user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    if (face.image_path) {
      await supabase.storage.from("people-photos").remove([face.image_path])
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Faces] DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete face" }, { status: 500 })
  }
}
